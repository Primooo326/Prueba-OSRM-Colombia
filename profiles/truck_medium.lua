package.path = "/opt/?.lua;/opt/lib/?.lua;" .. package.path
api_version = 4

-- CONSTANTES
obstacle_type = { barrier = 1, gate = 2, bollard = 3, entrance = 4, height_restrictor = 5, toll_booth = 6, sally_port = 7, gate_lift = 8, no = 9, stop = 10, stop_minor = 11, traffic_signals = 12 }
obstacle_direction = { none = 0, forward = 1, backward = 2, both = 3 }
mode = { driving = 1, cycling = 2, walking = 3, ferry = 4, train = 5, pushing_bike = 6, steps_up = 7, steps_down = 8, inaccessible = 9 }

-- LIBRERÍAS
Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require("lib/way_handlers")
Relations = require("lib/relations")
Obstacles = require("lib/obstacles")
find_access_tag = require("lib/access").find_access_tag
limit = require("lib/maxspeed").limit
Utils = require("lib/utils")
Measure = require("lib/measure")

-- INIT
if Obstacles.new then obstacle_map = Obstacles.new() else obstacle_map = Obstacles end

-- CONFIGURACIÓN CAMIÓN MEDIO
function setup()
  return {
    properties = {
      max_speed_for_map_matching      = 100/3.6, 
      weight_name                     = 'routability',
      process_call_tagless_node       = false,
      u_turn_penalty                  = 180,  -- Colombia: retorno casi imposible para camión (3 min)
      continue_straight_at_waypoint   = true,
      use_turn_restrictions           = true,
      left_hand_driving               = false,
      traffic_signal_penalty          = 35,   -- Camión arranca lento en semáforo
    },

    default_mode              = mode.driving,
    default_speed             = 10,
    oneway_handling           = true,
    side_road_multiplier      = 0.3, -- Muy penalizado en vías laterales
    turn_penalty              = 25,  -- Giros extremadamente lentos
    speed_reduction           = 0.45, -- Reducción brutal por peso + congestión
    turn_bias                 = 1.2,
    cardinal_directions       = false,

    -- DIMENSIONES 10T
    vehicle_height = 3.8,
    vehicle_width  = 2.5,
    vehicle_length = 10.0,
    vehicle_weight = 10000,

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

    -- VELOCIDADES CAMIÓN MEDIO — Colombia real (10T, montaña y congestión)
    speeds = Sequence {
      highway = {
        motorway        = 25,  -- Dobles calzadas, peso limita mucho
        motorway_link   = 18,
        trunk           = 22,  -- Troncales con pendientes
        trunk_link      = 15,
        primary         = 14,  -- Vías principales ciudad
        primary_link    = 10,
        secondary       = 10,  -- Conexiones barrios
        secondary_link  = 8,
        tertiary        = 8,   -- Terciarias
        tertiary_link   = 6,
        unclassified    = 6,   -- Rurales
        residential     = 6,   -- Barrios, maniobras difíciles
        living_street   = 3,
        service         = 5
      }
    },
    
    -- Resto de configuración estándar...
    service_penalties = { alley = 0.5, parking = 0.5, parking_aisle = 0.5, driveway = 0.5, ["drive-through"] = 0.5, ["drive-thru"] = 0.5 },
    restricted_highway_whitelist = Set { 'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential', 'living_street', 'unclassified', 'service' },
    construction_whitelist = Set { 'no', 'widening', 'minor' },
    route_speeds = { ferry = 5, shuttle_train = 10 },
    bridge_speeds = { movable = 5 },
    -- Colombia: superficies sin pavimentar muy peligrosas para camión
    surface_speeds = { asphalt = nil, concrete = nil, ["concrete:plates"] = nil, ["concrete:lanes"] = nil, paved = nil, cement = 16, compacted = 10, fine_gravel = 6, paving_stones = 12, metal = 12, bricks = 8, grass = 2, wood = 4, sett = 6, grass_paver = 2, gravel = 4, unpaved = 3, ground = 2, dirt = 1, pebblestone = 4, tartan = 8, cobblestone = 5, clay = 2, earth = 2, stone = 3, rocky = 2, sand = 1, mud = 1 },
    tracktype_speeds = { grade1 = 12, grade2 = 6, grade3 = 3, grade4 = 2, grade5 = 1 },
    smoothness_speeds = { intermediate = 14, bad = 6, very_bad = 3, horrible = 2, very_horrible = 1, impassable = 0 },
    maxspeed_table_default = { urban = 8, rural = 20, trunk = 24, motorway = 28 },
    maxspeed_table = {},
    relation_types = Sequence { "route" },
    highway_turn_classification = {},
    access_turn_classification = {}
  }
end

-- Funciones process_node, process_way y process_turn iguales a los anteriores...
function process_node(profile, node, result, relations)
  local access = find_access_tag(node, profile.access_tags_hierarchy)
  if access then
    if profile.access_tag_blacklist[access] and not profile.restricted_access_tag_list[access] then result.barrier = true end
  else
    local barrier = node:get_value_by_key("barrier")
    if barrier then
      local restricted_by_height = false
      if barrier == 'height_restrictor' then
         local maxheight = Measure.get_max_height(node:get_value_by_key("maxheight"), node)
         restricted_by_height = maxheight and maxheight < profile.vehicle_height
      end
      if not profile.barrier_whitelist[barrier] or restricted_by_height then result.barrier = true end
    end
  end

  -- Penalización por semáforo
  local highway = node:get_value_by_key("highway")
  if highway == "traffic_signals" then
    result.traffic_lights = true
    result.duration = (profile.properties.traffic_signal_penalty or 0)
  end

  if Handlers and Handlers.process_node then Handlers.process_node(profile, node, result, relations) end
end

function process_way(profile, way, result, relations)
  local data = { highway = way:get_value_by_key('highway'), bridge = way:get_value_by_key('bridge'), route = way:get_value_by_key('route') }
  if (not data.highway or data.highway == '') and (not data.route or data.route == '') then return end
  handlers = Sequence { Handlers.default_mode, Handlers.blocked_ways, Handlers.avoid_ways, Handlers.handle_height, Handlers.handle_width, Handlers.handle_length, Handlers.handle_weight, Handlers.access, Handlers.oneway, Handlers.destinations, Handlers.ferries, Handlers.movables, Handlers.service, Handlers.hov, Handlers.speed, Handlers.maxspeed, Handlers.surface, Handlers.penalties, Handlers.classes, Handlers.turn_lanes, Handlers.classification, Handlers.roundabouts, Handlers.startpoint, Handlers.driving_side, Handlers.names, Handlers.weights, Handlers.way_classification_for_turn }
  Handlers.run(profile, way, result, data, handlers, relations)
  if profile.cardinal_directions then Relations.process_way_refs(way, relations, result) end
end

function process_turn(profile, turn)
  local turn_penalty = profile.turn_penalty
  local turn_bias = turn.is_left_hand_driving and 1. / profile.turn_bias or profile.turn_bias
  if turn.number_of_roads > 2 or turn.source_mode ~= turn.target_mode or turn.is_u_turn then
    if turn.angle >= 0 then turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 / turn_bias) * turn.angle/180 - 6.5*turn_bias)))
    else turn.duration = turn.duration + turn_penalty / (1 + math.exp( -((13 * turn_bias) * -turn.angle/180 - 6.5/turn_bias))) end
    if turn.is_u_turn then turn.duration = turn.duration + profile.properties.u_turn_penalty end
  end
  if profile.properties.weight_name == 'distance' then turn.weight = 0 else turn.weight = turn.duration end
  if profile.properties.weight_name == 'routability' then if not turn.source_restricted and turn.target_restricted then turn.weight = constants.max_turn_weight end end
end

return { setup = setup, process_way = process_way, process_node = process_node, process_turn = process_turn }