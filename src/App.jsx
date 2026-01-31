import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, EyeOff, Download, Upload, Type, Eraser, FileText, X, AlertTriangle, Image as ImageIcon, CheckCircle, Maximize, File, ChevronLeft, ChevronRight, MapPin, User, Cpu } from 'lucide-react';

/**
 * STK Anon - Secure Privacy Tool (Desktop Engine)
 * Version 1.7
 */

// --- UTILITAIRES SYSTÈME ---

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// --- COMPOSANTS UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, active, variant = "primary", className = "", disabled = false, title = "" }) => {
  const baseStyle = "px-4 py-2 rounded font-medium transition-all duration-200 flex items-center gap-2 text-sm select-none";
  const variants = {
    primary: active 
      ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]" 
      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white",
    action: "bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-900/20",
    danger: "bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40",
    ghost: "bg-transparent text-neutral-500 hover:text-neutral-300"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Slider = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-xs text-neutral-400 uppercase tracking-wider">{label}</label>
      <span className="text-xs text-orange-500 font-mono">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step} 
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
    />
  </div>
);

// --- CŒUR DE L'APPLICATION ---

export default function App() {
  // États de l'application
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [mode, setMode] = useState('metadata'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  
  // États PDF spécifiques
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  // États Métadonnées étendues
  const [metaInfo, setMetaInfo] = useState({ 
    width: 0, 
    height: 0, 
    mp: 0,
    author: 'N/A',
    producer: 'N/A',
    gps: 'Non détecté' 
  });

  // Configuration Filigrane
  const [wmText, setWmText] = useState("CONFIDENTIEL");
  const [wmSize, setWmSize] = useState(40);
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmDensity, setWmDensity] = useState(150);
  const [wmColor, setWmColor] = useState("#808080");
  const [wmRotate, setWmRotate] = useState(-45);

  // Configuration Caviardage
  const [rects, setRects] = useState([]); 
  // Stockage des rects pour TOUTES les pages : { 1: [rects], 2: [rects], ... }
  const [allPageRects, setAllPageRects] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // --- LOGIQUE MULTI-PAGE & PERSISTANCE ---

  // Sauvegarder les rects de la page actuelle quand ils changent
  useEffect(() => {
    if (isPdf && currentPage > 0) {
        setAllPageRects(prev => ({
            ...prev,
            [currentPage]: rects
        }));
    }
  }, [rects, isPdf, currentPage]);

  // --- MOTEUR PDF ---
  
  const renderPdfPage = async (pdf, pageNum) => {
    setIsProcessing(true);
    try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        await page.render({ canvasContext: tempCtx, viewport }).promise;
        
        setImageSrc(tempCanvas.toDataURL('image/jpeg', 0.9));
    } catch (err) {
        console.error("Erreur Rendu Page:", err);
    } finally {
        setIsProcessing(false);
    }
  };

  const processPdfToImage = async (fileData) => {
    setIsProcessing(true);
    setProgressText("Analyse du PDF...");
    try {
        if (!window.pdfjsLib) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        const uri = URL.createObjectURL(fileData);
        const loadingTask = window.pdfjsLib.getDocument(uri);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setAllPageRects({}); // Reset global rects

        // Extraction Métadonnées
        const metadata = await pdf.getMetadata().catch(() => ({ info: {} }));
        setMetaInfo(prev => ({
            ...prev,
            author: metadata.info?.Author || "Inconnu",
            producer: metadata.info?.Producer || "Inconnu",
            gps: "Non applicable (PDF)"
        }));

        await renderPdfPage(pdf, 1);
        setMode('metadata');
    } catch (err) {
        console.error("Erreur PDF Engine:", err);
        alert("Impossible de lire le fichier PDF.");
    } finally {
        setIsProcessing(false);
        setProgressText("");
    }
  };

  const changePage = (delta) => {
      const newPage = currentPage + delta;
      if (newPage >= 1 && newPage <= numPages && pdfDoc) {
          // On change la page actuelle
          setCurrentPage(newPage);
          // On charge les rects de la nouvelle page (ou vide si rien)
          setRects(allPageRects[newPage] || []);
          renderPdfPage(pdfDoc, newPage);
      }
  };

  // --- GESTION FICHIERS ---

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setRects([]);
    setAllPageRects({});
    setFile(selectedFile);
    setImageSrc(null);
    setPdfDoc(null);
    setNumPages(0);
    
    setMetaInfo({ width: 0, height: 0, mp: 0, author: 'Analysé...', producer: 'Analysé...', gps: 'Recherche...' });

    if (selectedFile.type === 'application/pdf') {
      setIsPdf(true);
      processPdfToImage(selectedFile);
    } else if (selectedFile.type.startsWith('image/')) {
      setIsPdf(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
        setMetaInfo(prev => ({ ...prev, author: 'Non détecté', producer: 'Caméra Standard', gps: 'Non détecté' }));
      };
      reader.readAsDataURL(selectedFile);
    } else {
      alert("Format non supporté.");
    }
  };

  const resetApp = () => {
    setFile(null);
    setImageSrc(null);
    setIsPdf(false);
    setPdfDoc(null);
    setRects([]);
    setAllPageRects({});
    setMetaInfo({ width: 0, height: 0, mp: 0, author: 'N/A', producer: 'N/A', gps: 'N/A' });
  };

  // --- RENDU GRAPHIQUE (Canvas) ---
  
  // Fonction utilitaire pour dessiner les calques (utilisée par l'écran ET l'export)
  const drawOverlays = (ctx, width, height, currentRects) => {
      // Calque Filigrane (Toujours visible si configuré, pour l'export)
      if (wmText && wmText.trim() !== "") {
        ctx.save();
        ctx.font = `bold ${wmSize}px Arial, sans-serif`;
        ctx.fillStyle = wmColor;
        ctx.globalAlpha = wmOpacity;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const diagonal = Math.sqrt(width**2 + height**2);
        
        ctx.translate(width / 2, height / 2);
        ctx.rotate((wmRotate * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);

        for (let x = -diagonal; x < diagonal; x += wmDensity + wmSize) {
          for (let y = -diagonal; y < diagonal; y += wmDensity) {
            ctx.fillText(wmText, x, y);
          }
        }
        ctx.restore();
      }

      // Calque Caviardage
      ctx.fillStyle = "#000000";
      currentRects.forEach(rect => {
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      });
  };

  const draw = useCallback(() => {
    if (!canvasRef.current || !imageSrc) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.src = imageSrc;
    img.onload = () => {
      setMetaInfo(prev => ({
        ...prev,
        width: img.width,
        height: img.height,
        mp: (img.width * img.height / 1000000).toFixed(1)
      }));

      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Image de fond
      ctx.drawImage(img, 0, 0);

      // 2. Calques (Filigrane + Rects)
      if (mode === 'watermark' || mode === 'metadata' || mode === 'redact') {
          const shouldShowWatermark = (mode === 'watermark');
          
          if (shouldShowWatermark) {
              drawOverlays(ctx, canvas.width, canvas.height, rects);
          } else {
              // Si pas mode watermark, on dessine manuellement juste les rects
              ctx.fillStyle = "#000000";
              rects.forEach(rect => {
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
              });
          }
      }
    };
  }, [imageSrc, mode, wmText, wmSize, wmOpacity, wmDensity, wmColor, wmRotate, rects]);

  useEffect(() => {
    draw();
  }, [draw]);

  // --- GESTION SOURIS ---

  const getPos = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (mode !== 'redact') return;
    setIsDrawing(true);
    setStartPos(getPos(e));
  };

  const drawRect = (e) => {
    if (!isDrawing || mode !== 'redact') return;
    const currentPos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    
    draw(); 
    
    ctx.fillStyle = "#000000";
    const w = currentPos.x - startPos.x;
    const h = currentPos.y - startPos.y;
    ctx.fillRect(startPos.x, startPos.y, w, h);
  };

  const endDrawing = (e) => {
    if (!isDrawing || mode !== 'redact') return;
    setIsDrawing(false);
    const endPos = getPos(e);
    const newRect = {
      x: startPos.x,
      y: startPos.y,
      w: endPos.x - startPos.x,
      h: endPos.y - startPos.y
    };
    
    if (newRect.w < 0) { newRect.x += newRect.w; newRect.w = Math.abs(newRect.w); }
    if (newRect.h < 0) { newRect.y += newRect.h; newRect.h = Math.abs(newRect.h); }

    if (newRect.w > 5 && newRect.h > 5) {
      setRects([...rects, newRect]);
    }
  };

  const undoLastRect = () => setRects(rects.slice(0, -1));

  // --- EXPORT FICHIER (CORE FEATURE) ---

  const handleDownload = async () => {
    setIsProcessing(true);
    setProgressText("Initialisation...");

    try {
        if (isPdf && pdfDoc) {
            // --- EXPORT PDF MULTI-PAGES ---
            if (!window.jspdf) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            const { jsPDF } = window.jspdf;
            
            const doc = new jsPDF({ unit: 'px' });
            doc.deletePage(1); 

            // BOUCLE SUR TOUTES LES PAGES
            for (let i = 1; i <= numPages; i++) {
                setProgressText(`Traitement page ${i} sur ${numPages}...`);
                
                // 1. Rendu
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = viewport.width;
                tempCanvas.height = viewport.height;
                const tempCtx = tempCanvas.getContext('2d');
                
                await page.render({ canvasContext: tempCtx, viewport }).promise;
                
                // 2. Modifs
                const rectsForThisPage = allPageRects[i] || [];
                drawOverlays(tempCtx, tempCanvas.width, tempCanvas.height, rectsForThisPage);
                
                // 3. Ajout
                const imgData = tempCanvas.toDataURL('image/jpeg', 0.85);
                
                doc.addPage([viewport.width, viewport.height], viewport.width > viewport.height ? 'l' : 'p');
                doc.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
            }
            
            setProgressText("Finalisation...");
            doc.save(`stk_anon_full_${Date.now()}.pdf`);
            
        } else if (canvasRef.current) {
            // --- EXPORT IMAGE SIMPLE ---
            canvasRef.current.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `stk_anon_secure_${Date.now()}.png`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, 'image/png');
        }
    } catch (e) {
        console.error("Erreur Export:", e);
        alert("Erreur lors de la génération du fichier final.");
    } finally {
        setIsProcessing(false);
        setProgressText("");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-orange-900 selection:text-white pb-20">
      
      {/* HEADER */}
      <header className="bg-neutral-900 border-b border-orange-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            
            {/* LOGO PERSONNALISÉ */}
            <img 
                src="/logo.png" 
                alt="STK Logo" 
                className="w-10 h-10 rounded shadow-lg border border-orange-500/20 object-cover"
                onError={(e) => {
                    e.target.onerror = null; 
                    // Fallback visuel si le logo n'est pas trouvé
                    e.target.src = "https://placehold.co/512x512/ea580c/white?text=STK";
                }}
            />
            
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">STK <span className="text-orange-500">Anon</span></h1>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Privacy Engineering Tool {isPdf ? '(PDF Mode)' : ''}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* UPLOADER */}
        {!file ? (
          <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-900/50 hover:border-orange-500/50 transition-colors group relative overflow-hidden">
             {isProcessing && (
                 <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center">
                     <span className="text-orange-500 font-mono animate-pulse">{progressText || "CHARGEMENT..."}</span>
                 </div>
             )}
            <div className="bg-neutral-800 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <Upload size={48} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Charger un document</h2>
            <p className="text-neutral-400 max-w-md text-center mb-8 relative z-10">
              Support complet : Images (JPG, PNG) et Documents (PDF)
            </p>
            <label className="relative z-10 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded font-medium cursor-pointer transition-colors shadow-lg shadow-orange-900/20">
              Ouvrir le fichier
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
            </label>
          </div>
        ) : (
          /* WORKSPACE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            
            {/* SIDEBAR */}
            <div className="lg:col-span-3 space-y-6">
              
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Tool Box</h3>
                    <Button variant="danger" onClick={resetApp} className="px-2 py-1 text-xs" title="Fermer le document">
                        <X size={14} /> Fermer
                    </Button>
                </div>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant={mode === 'metadata' ? 'primary' : 'ghost'}
                    active={mode === 'metadata'}
                    onClick={() => setMode('metadata')}
                  >
                    <FileText size={16} /> Métadonnées
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant={mode === 'watermark' ? 'primary' : 'ghost'}
                    active={mode === 'watermark'}
                    onClick={() => setMode('watermark')}
                  >
                    <Type size={16} /> Filigrane
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant={mode === 'redact' ? 'primary' : 'ghost'}
                    active={mode === 'redact'}
                    onClick={() => setMode('redact')}
                  >
                    <EyeOff size={16} /> Anonymisation
                  </Button>
                </div>
              </Card>

              {/* CONTEXTUAL TOOLS */}
              <Card className="p-4 bg-neutral-900/80">
                {mode === 'watermark' && (
                  <div className="animate-fadeIn">
                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-4">Filigrane</h3>
                    <div className="mb-4">
                      <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">Texte</label>
                      <input 
                        type="text" 
                        value={wmText}
                        onChange={(e) => setWmText(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="mb-4">
                         <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">Couleur</label>
                         <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} className="w-full h-8 bg-transparent cursor-pointer rounded block"/>
                    </div>
                    <Slider label="Taille" value={wmSize} min={10} max={200} onChange={setWmSize} />
                    <Slider label="Opacité" value={wmOpacity} min={0.1} max={1} step={0.05} onChange={setWmOpacity} />
                    <Slider label="Densité" value={wmDensity} min={50} max={500} onChange={setWmDensity} />
                    <Slider label="Rotation" value={wmRotate} min={-90} max={90} onChange={setWmRotate} />
                  </div>
                )}

                {mode === 'redact' && (
                  <div className="animate-fadeIn">
                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-4">Caviardage</h3>
                    <p className="text-sm text-neutral-400 mb-4">
                      Tracez des rectangles sur le document pour masquer les zones sensibles.
                    </p>
                    <Button onClick={undoLastRect} variant="ghost" className="w-full border border-neutral-700" disabled={rects.length === 0}>
                      <Eraser size={14} /> Annuler dernier
                    </Button>
                  </div>
                )}

                {mode === 'metadata' && (
                  <div className="animate-fadeIn">
                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-4">Inspection Fichier</h3>
                    {file && (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2 border-b border-neutral-800 pb-2">
                          <span className="text-neutral-500">Nom</span>
                          <span className="text-neutral-200 text-right truncate">{file.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-b border-neutral-800 pb-2">
                          <span className="text-neutral-500">Type</span>
                          <span className="text-neutral-200 text-right flex items-center justify-end gap-2">
                              {isPdf ? <File size={12} className="text-orange-500"/> : <ImageIcon size={12}/>}
                              {isPdf ? 'PDF Document' : file.type}
                          </span>
                        </div>
                        
                        {/* NOUVELLES METADONNEES */}
                        <div className="grid grid-cols-2 gap-2 border-b border-neutral-800 pb-2">
                             <span className="text-neutral-500 flex items-center gap-1"><User size={10}/> Auteur</span>
                             <span className="text-neutral-200 text-right truncate" title={metaInfo.author}>{metaInfo.author}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-b border-neutral-800 pb-2">
                             <span className="text-neutral-500 flex items-center gap-1"><Cpu size={10}/> Logiciel</span>
                             <span className="text-neutral-200 text-right truncate" title={metaInfo.producer}>{metaInfo.producer}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-b border-neutral-800 pb-2">
                             <span className="text-neutral-500 flex items-center gap-1"><MapPin size={10}/> GPS</span>
                             <span className="text-neutral-200 text-right">{metaInfo.gps}</span>
                        </div>

                        {metaInfo.width > 0 && (
                            <>
                                <div className="grid grid-cols-2 gap-2 border-b border-neutral-800 pb-2">
                                <span className="text-neutral-500">Rendu</span>
                                <span className="text-neutral-200 text-right">{metaInfo.width} x {metaInfo.height} px</span>
                                </div>
                            </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Button 
                variant="action" 
                className="w-full justify-center py-4 mt-6"
                onClick={handleDownload}
                disabled={isProcessing}
              >
                {isProcessing ? 'Génération...' : `ENREGISTRER ${isPdf ? '(Complet)' : ''}`} 
                <Download size={18} />
              </Button>
            </div>

            {/* MAIN AREA */}
            <div className="lg:col-span-9 h-full flex flex-col">
              <div 
                ref={containerRef}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-inner flex items-center justify-center overflow-auto p-4 relative"
                style={{ 
                    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}
              >
                {/* LOADER OVERLAY */}
                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                        <span className="text-white font-mono text-sm">{progressText || "Traitement..."}</span>
                    </div>
                )}

                {/* CANVAS RENDERING */}
                {mode === 'redact' && (
                    <div className="absolute top-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none z-10 flex items-center gap-2 border border-orange-500/30">
                        <Eraser size={12} className="text-orange-500"/> Mode Caviardage actif
                    </div>
                )}
                
                <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={drawRect}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    className={`max-w-full max-h-[80vh] shadow-2xl transition-cursor ${mode === 'redact' ? 'cursor-crosshair' : 'cursor-default'}`}
                />
              </div>

              {/* PAGINATION CONTROL (Seulement si PDF et > 1 page) */}
              {isPdf && numPages > 1 && (
                  <div className="mt-4 flex justify-center items-center gap-4 bg-neutral-900 border border-neutral-800 p-3 rounded-lg mx-auto">
                      <Button onClick={() => changePage(-1)} disabled={currentPage <= 1} variant="ghost" className="px-3">
                          <ChevronLeft size={20}/>
                      </Button>
                      <span className="font-mono text-sm text-white">
                          PAGE <span className="text-orange-500">{currentPage}</span> / {numPages}
                      </span>
                      <Button onClick={() => changePage(1)} disabled={currentPage >= numPages} variant="ghost" className="px-3">
                          <ChevronRight size={20}/>
                      </Button>
                  </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}