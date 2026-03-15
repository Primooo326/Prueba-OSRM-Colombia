import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import DataPanel from './components/DataPanel';
import JobConfigModal from './components/JobConfigModal';

export default function App() {
    return (
        <AppProvider>
            <div className="flex flex-col h-screen bg-base-100 overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 relative">
                        <MapView />
                    </main>
                </div>
                <DataPanel />
                <JobConfigModal />
            </div>
        </AppProvider>
    );
}
