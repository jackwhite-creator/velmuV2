import { useState, useEffect, useRef } from 'react';
import { useServerStore, Server } from '../../store/serverStore';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  server: Server;
}

export default function ServerOverview({ server }: Props) {
  const { setServers, servers, setActiveServer } = useServerStore();
  const [name, setName] = useState(server.name);
  const [previewUrl, setPreviewUrl] = useState(server.iconUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(server.name);
    setPreviewUrl(server.iconUrl || '');
    setSelectedFile(null);
    setHasChanges(false);
  }, [server]);

  useEffect(() => {
    const isDifferent = name !== server.name || selectedFile !== null;
    setHasChanges(isDifferent);
  }, [name, selectedFile, server]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setName(server.name);
    setPreviewUrl(server.iconUrl || '');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (selectedFile) {
        formData.append('icon', selectedFile);
      }

      const res = await api.put(`/servers/${server.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const updatedServer = res.data;
      const updatedList = servers.map(s => s.id === server.id ? { ...s, ...updatedServer } : s);
      
      setServers(updatedList);
      setActiveServer({ ...server, ...updatedServer });
      setHasChanges(false);
      setSelectedFile(null);

    } catch (error) {
      console.error("Erreur update serveur", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background-primary relative h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-24">
        <h1 className="text-xl font-bold text-text-header mb-8">Vue d'ensemble du serveur</h1>

        <div className="flex flex-col gap-10 max-w-2xl">
            
            <div className="flex gap-8 items-start">
                <div className="flex-shrink-0 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-28 h-28 rounded-full bg-background-secondary flex items-center justify-center overflow-hidden shadow-md transition-all relative">
                        {previewUrl ? (
                            <img src={previewUrl} className="w-full h-full object-cover" alt="Serveur" />
                        ) : (
                            <span className="text-3xl font-bold text-text-muted group-hover:text-text-normal transition-colors">
                                {name.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                    />
                    {selectedFile ? (
                        <p className="text-[10px] text-status-green text-center mt-3 font-bold uppercase tracking-wide">Nouvelle image</p>
                    ) : (
                        <p className="text-[10px] text-text-muted text-center mt-3 font-medium uppercase tracking-wide group-hover:text-text-normal transition-colors">Changer l'icône</p>
                    )}
                </div>

                <div className="flex-1 pt-2">
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-wide ml-1">
                        Nom du serveur
                    </label>
                    <input 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-background-tertiary border-none rounded-sm p-3 text-text-header font-medium focus:ring-1 focus:ring-brand outline-none transition-all placeholder-text-muted"
                        placeholder="Le meilleur serveur..."
                    />
                </div>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            className="absolute bottom-6 left-6 right-6 p-3 bg-[#111214] rounded-md shadow-2xl flex items-center justify-between border border-background-tertiary z-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
              <p className="text-sm text-text-header font-medium px-2">Attention, tu as des modifications non enregistrées !</p>
              <div className="flex gap-4 items-center">
                  <button onClick={handleReset} className="text-sm font-medium hover:underline text-text-header">Réinitialiser</button>
                  <button onClick={handleSave} disabled={isLoading} className="bg-status-green hover:brightness-110 text-white px-6 py-1.5 rounded-sm text-sm font-bold transition disabled:opacity-50 shadow-sm">
                      {isLoading ? '...' : 'Enregistrer'}
                  </button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}