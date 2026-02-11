-- 1. FIX DOCKER
package.path = "/opt/?.lua;/opt/lib/?.lua;" .. package.path

api_version = 4

-- 2. CONSTANTES
obstacle_type = { barrier = 1, gate = 2, bollard = 3, entrance = 4, height_restrictor = 5, toll_booth = 6, sally_port = 7, gate_lift = 8, no = 9, stop = 10, stop_minor = 11, traffic_signals = 12 }
obstacle_direction = { none = 0, forward = 1, backward = 2, both = 3 }
mode = { driving = 1, cycling = 2, walking = 3, ferry = 4, train = 5, pushing_bike = 6, steps_up = 7, steps_down = 8, inaccessible = 9 }

-- 3. LIBRERÍAS
Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require("lib/way_handlers")
Relations = require("lib/relations")
Obstacles = require("lib/obstacles")
find_access_tag = require("lib/access").find_access_tag
limit = require("lib/maxspeed").limit
Utils = require("lib/utils")
Measure = require("lib/measure")

-- 4. INICIALIZACIÓN
if Obstacles.new then obstacle_map = Obstacles.new() else obstacle_map = Obstacles end

-- 5. CONFIGURACIÓN VAN
function setup()
  return {
    properties = {
      max_speed_for_map_matching      = 140/3.6, 
      weight_name                     = 'routability',
      process_call_tagless_node       = false,
      u_turn_penalty                  = 120,  -- Colombia: retornos costosos (2 min)
      continue_straight_at_waypoint   = true,
      use_turn_restrictions           = true,
      left_hand_driving               = false,
      traffic_signal_penalty          = 30,   -- Colombia: semáforos largos
    },

    default_mode              = mode.driving,
    default_speed             = 10,
    oneway_handling           = true,
    side_road_multiplier      = 0.4,  -- Evitar atajos, van no cabe bien
    turn_penalty              = 18,   -- Giros muy lentos + congestión
    speed_reduction           = 0.5,  -- Colombia: congestión pesada para vans
    turn_bias                 = 1.15,
    cardinal_directions       = false,

    -- DIMENSIONES VAN
    vehicle_height = 2.6,
    vehicle_width  = 2.2,
    vehicle_length = 6.0,
    vehicle_weight = 3500, -- 3.5T

    suffix_list = { 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'North', 'South', 'West', 'East', 'Nor', 'Sou', 'We', 'Ea' },
    barrier_whitelist = Set { 'cattle_grid', 'border_control', 'toll_booth', 'sally_port', 'gate', 'lift_gate', 'no', 'entrance', 'height_restrictor', 'arch' },
    access_tag_whitelist = Set { 'yes', 'motorcar', 'motor_vehicle', 'vehicle', 'permissive', 'designated', 'hov' },
    access_tag_blacklist = Set { 'no', 'agricultural', 'forestry', 'emergency', 'psv', 'customers', 'private', 'delivery', 'destination' },
    service_access_tag_blacklist = Set { 'private' },
    restricted_access_tag_list = Set { 'private', 'delivery', 'destination', 'customers' },
    access_tags_hierarchy = Sequence { 'motorcar', 'motor_vehicle', 'vehicle', 'access' },
    service_tag_forbidden = Set { 'emergency_access' },
    restrictions = Sequence { 'motorcar', 'motor_vehicle', 'vehicle' },
    classes = Sequence { 'toll', 'motorway', 'ferry', 'restricted', 'tunnel' },
    excludable = Sequence { Set {'toll'}, Set {'motorway'}, Set {'ferry'} },
    avoid = Set { 'area', 'reversible', 'impassable', 'hov_lanes', 'steps', 'construction', 'proposed' },

    -- VELOCIDADES VAN — Colombia real (delivery, más lenta que carro)
    speeds = Sequence {
      highway = {
        motorway        = 30,  -- Dobles calzadas
        motorway_link   = 22,
        trunk           = 25,  -- Troncales nacionales
        trunk_link      = 18,
        primary         = 14,  -- Vías principales ciudad
        primary_link    = 10,
        secondary       = 10,  -- Conexiones barrios
        secondary_link  = 8,
        tertiary        = 8,
        tertiary_link   = 6,
        unclassified    = 6,
        residential     = 8,   -- Barrios, entregas
        living_street   = 4,
        service         = 5
      }
    },

    service_penalties = { alley = 0.5, parking = 0.5, parking_aisle = 0.5, driveway = 0.5, ["drive-through"] = 0.5, ["drive-thru"] = 0.5 },
    restricted_highway_whitelist = Set { 'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential', 'living_street', 'unclassified', 'service' },
    construction_whitelist = Set { 'no', 'widening', 'minor' },
    route_speeds = { ferry = 5, shuttle_train = 10 },
    bridge_speeds = { movable = 5 },
    -- Colombia: superficies sin pavimentar drásticamente más lentas
    surface_speeds = { asphalt = nil, concrete = nil, ["concrete:plates"] = nil, ["concrete:lanes"] = nil, paved = nil, cement = 18, compacted = 12, fine_gravel = 8, paving_stones = 14, metal = 14, bricks = 10, grass = 3, wood = 6, sett = 8, grass_paver = 3, gravel = 5, unpaved = 4, ground = 3, dirt = 2, pebblestone = 5, tartan = 10, cobblestone = 6, clay = 2, earth = 2, stone = 3, rocky = 3, sand = 2, mud = 1 },
    tracktype_speeds = { grade1 = 14, grade2 = 8, grade3 = 5, grade4 = 3, grade5 = 2 },
    smoothness_speeds = { intermediate = 16, bad = 8, very_bad = 4, horrible = 2, very_horrible = 1, impassable = 0 },
    maxspeed_table_default = { urban = 10, rural = 25, trunk = 28, motorway = 32 },
    maxspeed_table = {},
    relation_types = Sequence { "route" },
    highway_turn_classification = {},
    access_turn_classification = {}
  }
end

function process_node(profile, node, result, relations)
  local access = find_access_tag(node, profile.access_tags_hierarchy)
  if access then
    if profile.access_tag_blacklist[access] and not profile.restricted_access_tag_list[access] then
      result.barrier = true
    end
  else
    local barrier = node:get_value_by_key("barrier")
    if barrier then
      local restricted_by_height = false
      if barrier == 'height_restrictor' then
         local maxheight = Measure.get_max_height(node:get_value_by_key("maxheight"), node)
         restricted_by_height = maxheight and maxheight < profile.vehicle_height
      end
      local bollard = node:get_value_by_key("bollard")
      local rising_bollard = bollard and "rising" == bollard
      local kerb = node:get_value_by_key("kerb")
      local highway = node:get_value_by_key("highway")
      local flat_kerb = kerb and ("lowered" == kerb or "flush" == kerb)
      local highway_crossing_kerb = barrier == "kerb" and highway and highway == "crossing"

      if not profile.barrier_whitelist[barrier] and not rising_bollard and not flat_kerb and not highway_crossing_kerb or restricted_by_height then
        result.barrier = true
      end
    end
  end

  -- Penalización por semáforo
  local highway2 = node:get_value_by_key("highway")
  if highway2 == "traffic_signals" then
    result.traffic_lights = true
  end

  if Handlers and Handlers.process_node then Handlers.process_node(profile, node, result, relations) end
end

function process_way(profile, way, result, relations)
  local data = { highway = way:get_value_by_key('highway'), bridge = way:get_value_by_key('bridge'), route = way:get_value_by_key('route') }
  if (not data.highway or data.highway == '') and (not data.route or data.route == '') then return end

  handlers = Sequence {
    Handlers.default_mode, Handlers.blocked_ways, Handlers.avoid_ways,
    Handlers.handle_height, Handlers.handle_width, Handlers.handle_length, Handlers.handle_weight,
    Handlers.access, Handlers.oneway, Handlers.destinations, Handlers.ferries, Handlers.movables,
    Handlers.service, Handlers.hov, Handlers.speed, Handlers.maxspeed, Handlers.surface,
    Handlers.penalties, Handlers.classes, Handlers.turn_lanes, Handlers.classification,
    Handlers.roundabouts, Handlers.startpoint, Handlers.driving_side, Handlers.names,
    Handlers.weights, Handlers.way_classification_for_turn
  }
  Handlers.run(profile, way, result, data, handlers, relations)
  if profile.cardinal_directions then Relations.process_way_refs(way, relations, result) end
end

function process_turn(profile, turn)
  local turn_penalty = profile.turn_penalty
  local turn_bias = turn.is_left_hand_driving and 1. / profile.turn_bias or profile.turn_bias
  -- Lógica simplificada sin obstacle_map para evitar errores de versión
  if turn.number_of_roads > 2 or turn.source_mode ~= turn.target_mode or turn.is_u_turn then
    if turn.angle >= 0 then turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 / turn_bias) * turn.angle/180 - 6.5*turn_bias)))
    else turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 * turn_bias) * -turn.angle/180 - 6.5/turn_bias))) end
    if turn.is_u_turn then turn.duration = turn.duration + profile.properties.u_turn_penalty end
  end
  if profile.properties.weight_name == 'distance' then turn.weight = 0 else turn.weight = turn.duration end
  if profile.properties.weight_name == 'routability' then
      if not turn.source_restricted and turn.target_restricted then turn.weight = constants.max_turn_weight end
  end
end

return { setup = setup, process_way = process_way, process_node = process_node, process_turn = process_turn }