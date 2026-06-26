import React, { useState, useEffect, useRef } from 'react'
import {
  Camera,
  Upload,
  Crop,
  Check,
  Plus,
  Trash2,
  Users,
  Percent,
  Copy,
  FileText,
  Sparkles,
  ArrowLeft,
  Sun,
  Moon,
  Info,
  X,
  Share2,
  Lock,
  Edit2,
  Menu,
  Folder
} from 'lucide-react'
import Tesseract from 'tesseract.js'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

// IndexedDB Helper to persist raw and cropped image binaries/base64 without exceeding localStorage quotas
const dbName = "BillSplitterDB";
const storeName = "images";

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}

async function saveImageToDB(id, dataUrl) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put(dataUrl, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to save image to IndexedDB", e);
  }
}

async function getImageFromDB(id) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to get image from IndexedDB", e);
    return null;
  }
}

async function deleteImageFromDB(id) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to delete image from IndexedDB", e);
  }
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return true
  })

  // Multiple Splits management
  const createNewSplitObject = (name = '') => {
    return {
      id: Math.random().toString(36).substring(2, 9),
      name: name || `Split ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      people: [], // default to zero people
      items: [],
      taxInput: '0.00',
      tipInput: '15',
      tipIsPercentage: true,
      step: 'upload',
      imageSrc: null,
      croppedImage: null,
    }
  }

  const [splits, setSplits] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bill_splits')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        } catch (e) {
          console.error("Failed to parse saved splits", e)
        }
      }
    }
    return [createNewSplitObject('My First Split')]
  })

  const [currentSplitId, setCurrentSplitId] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('current_split_id')
      if (savedId && splits.some(s => s.id === savedId)) {
        return savedId
      }
    }
    return splits[0].id
  })

  // Persist splits list (excluding large image base64 data to avoid localStorage quota limits) and active split ID
  useEffect(() => {
    const cleanedSplits = splits.map(s => {
      const { imageSrc, croppedImage, ...rest } = s
      return rest
    })
    localStorage.setItem('bill_splits', JSON.stringify(cleanedSplits))
  }, [splits])

  useEffect(() => {
    localStorage.setItem('current_split_id', currentSplitId)
  }, [currentSplitId])

  // Load images from IndexedDB when switching splits or reloading
  useEffect(() => {
    let active = true
    const loadImages = async () => {
      const srcImg = await getImageFromDB(`${currentSplitId}_src`)
      const cropImg = await getImageFromDB(`${currentSplitId}_cropped`)
      if (active) {
        const updates = {}
        if (srcImg && srcImg !== activeSplit.imageSrc) {
          updates.imageSrc = srcImg
        }
        if (cropImg && cropImg !== activeSplit.croppedImage) {
          updates.croppedImage = cropImg
        }
        if (Object.keys(updates).length > 0) {
          updateActiveSplit(updates)
        }
      }
    }
    loadImages()
    return () => {
      active = false
    }
  }, [currentSplitId])

  // Get active split data
  const activeSplit = splits.find(s => s.id === currentSplitId) || splits[0] || createNewSplitObject()

  // Helper to update active split fields
  const updateActiveSplit = (fields) => {
    setSplits(prevSplits => prevSplits.map(s => {
      if (s.id === activeSplit.id) {
        return { ...s, ...fields }
      }
      return s
    }))
  }

  // Map state fields
  const step = activeSplit.step
  const imageSrc = activeSplit.imageSrc
  const croppedImage = activeSplit.croppedImage
  const people = activeSplit.people
  const items = activeSplit.items
  const taxInput = activeSplit.taxInput
  const tipInput = activeSplit.tipInput
  const tipIsPercentage = activeSplit.tipIsPercentage

  // Map state setters
  const setStep = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.step) : val
    updateActiveSplit({ step: next })
  }
  const setImageSrc = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.imageSrc) : val
    updateActiveSplit({ imageSrc: next })
    if (next) {
      saveImageToDB(`${activeSplit.id}_src`, next)
    } else {
      deleteImageFromDB(`${activeSplit.id}_src`)
    }
  }
  const setCroppedImage = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.croppedImage) : val
    updateActiveSplit({ croppedImage: next })
    if (next) {
      saveImageToDB(`${activeSplit.id}_cropped`, next)
    } else {
      deleteImageFromDB(`${activeSplit.id}_cropped`)
    }
  }
  const setPeople = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.people) : val
    updateActiveSplit({ people: next })
  }
  const setItems = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.items) : val
    updateActiveSplit({ items: next })
  }
  const setTaxInput = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.taxInput) : val
    updateActiveSplit({ taxInput: next })
  }
  const setTipInput = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.tipInput) : val
    updateActiveSplit({ tipInput: next })
  }
  const setTipIsPercentage = (val) => {
    const next = typeof val === 'function' ? val(activeSplit.tipIsPercentage) : val
    updateActiveSplit({ tipIsPercentage: next })
  }

  // Helper actions for UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [renamingSplitId, setRenamingSplitId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const handleSaveRename = (id) => {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    setSplits(prev => prev.map(s => s.id === id ? { ...s, name: trimmed } : s))
    setRenamingSplitId(null)
  }

  const handleRenameSplit = (id, currentName) => {
    setRenamingSplitId(id)
    setRenameValue(currentName)
  }

  // Standalone/Transient component state
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState('')
  const [rawText, setRawText] = useState('')
  const [newPersonName, setNewPersonName] = useState('')

  // Refs for Image element and Cropper instance
  const imageRef = useRef(null)
  const cropperRef = useRef(null)

  // Custom Split Editor State
  const [editingItem, setEditingItem] = useState(null) // item object
  const [editSplitMode, setEditSplitMode] = useState('equal')
  const [editSplits, setEditSplits] = useState({})
  
  // Clipboard copied confirmation tooltip
  const [copied, setCopied] = useState(false)
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false)

  // Handle Theme
  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Initialize Cropper when stepping into 'crop' step with imageSrc
  useEffect(() => {
    if (step === 'crop' && imageSrc && imageRef.current) {
      if (cropperRef.current) {
        cropperRef.current.destroy()
      }
      
      cropperRef.current = new Cropper(imageRef.current, {
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.85,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        background: false,
      })
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy()
        cropperRef.current = null
      }
    }
  }, [step, imageSrc])

  // Image Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result)
        setStep('crop')
      }
      reader.readAsDataURL(file)
    }
  }

  // Draw crop box to canvas and perform OCR
  const handleCropAndScan = async () => {
    if (!cropperRef.current) return
    setStep('scanning')
    setScanStatus('Initializing OCR engine...')
    setScanProgress(0)

    try {
      // Get cropped image data from CropperJS
      const croppedCanvas = cropperRef.current.getCroppedCanvas({
        maxWidth: 2048,
        maxHeight: 2048,
      })

      if (!croppedCanvas) {
        throw new Error('Could not retrieve cropped canvas.')
      }

      const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg')
      setCroppedImage(croppedDataUrl)

      const result = await Tesseract.recognize(
        croppedDataUrl,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setScanStatus(`Extracting receipt items...`)
              setScanProgress(Math.round(m.progress * 100))
            } else if (m.status === 'loading tesseract api') {
              setScanStatus('Loading OCR language models...')
            }
          }
        }
      )
      
      setRawText(result.data.text)
      parseReceiptText(result.data.text)
      setStep('items')
    } catch (err) {
      console.error(err)
      alert('OCR failed. Please check the image and try again.')
      setStep('crop')
    }
  }

  // Regex receipt parser with logical grouping and price filtering heuristics
  const parseReceiptText = (text) => {
    const { items: parsedItems, tax, tip } = parseReceiptTextPure(text)

    if (parsedItems.length > 0) {
      const initialized = parsedItems.map(item => {
        return {
          id: Math.random().toString(36).substring(2, 9),
          name: item.name,
          price: item.price,
          splitMode: 'equal',
          splits: {}
        }
      })
      setItems(initialized)
    } else {
      setItems([])
    }

    if (tax !== null) setTaxInput(tax.toFixed(2))
    if (tip !== null) {
      setTipInput(tip.toFixed(2))
      setTipIsPercentage(false)
    }
  }

  // Manage People State
  const handleAddPerson = () => {
    const trimmed = newPersonName.trim()
    if (!trimmed) return
    if (people.includes(trimmed)) {
      alert('Name already exists!')
      return
    }
    const updatedPeople = [...people, trimmed]
    setPeople(updatedPeople)
    setNewPersonName('')
  }

  const handleRemovePerson = (name) => {
    setPeople(prev => prev.filter(p => p !== name))

    // Remove person from all item splits
    setItems(prevItems =>
      prevItems.map(item => {
        const nextSplits = { ...item.splits }
        delete nextSplits[name]
        return { ...item, splits: nextSplits }
      })
    )
  }

  // Item Management
  const handleAddItem = () => {
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'New Item',
      price: 0.00,
      splitMode: 'equal',
      splits: {}
    }
    setItems([...items, newItem])
  }

  const handleUpdateItem = (id, field, value) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          let updatedVal = value
          if (field === 'price') {
            updatedVal = parseFloat(value) || 0
          }
          return { ...item, [field]: updatedVal }
        }
        return item
      })
    )
  }

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // Equal split fast toggle
  const togglePersonOnItem = (itemId, personName) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          let nextSplits = { ...item.splits }
          let nextMode = item.splitMode

          if (nextMode !== 'equal') {
            nextMode = 'equal'
            nextSplits = {}
            people.forEach(p => {
              nextSplits[p] = p === personName
            })
          } else {
            nextSplits[personName] = !nextSplits[personName]
          }

          return { ...item, splitMode: nextMode, splits: nextSplits }
        }
        return item
      })
    )
  }

  // Open Custom Split Editor
  const openCustomSplitEditor = (item) => {
    setEditingItem(item)
    setEditSplitMode(item.splitMode)
    
    const initialSplits = {}
    people.forEach(p => {
      if (item.splitMode === 'shares') {
        initialSplits[p] = item.splits[p] !== undefined ? item.splits[p] : 1
      } else if (item.splitMode === 'percentage') {
        initialSplits[p] = item.splits[p] !== undefined ? item.splits[p] : 0
      } else if (item.splitMode === 'exact') {
        initialSplits[p] = item.splits[p] !== undefined ? item.splits[p] : 0
      } else {
        initialSplits[p] = item.splits[p] === true
      }
    })
    setEditSplits(initialSplits)
  }

  // Save Custom Split configs
  const saveCustomSplit = () => {
    if (!editingItem) return

    if (editSplitMode === 'percentage') {
      const sum = Object.values(editSplits).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
      if (Math.abs(sum - 100) > 0.01) {
        alert(`Percentages must sum to exactly 100%. Current sum: ${sum.toFixed(1)}%`)
        return
      }
    } else if (editSplitMode === 'exact') {
      const sum = Object.values(editSplits).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
      if (Math.abs(sum - editingItem.price) > 0.02) {
        alert(`Exact amounts must sum to the item's price ($${editingItem.price.toFixed(2)}). Current sum: $${sum.toFixed(2)}`)
        return
      }
    }

    setItems(prev =>
      prev.map(item => {
        if (item.id === editingItem.id) {
          const cleanedSplits = {}
          people.forEach(p => {
            if (editSplitMode === 'shares') {
              cleanedSplits[p] = parseInt(editSplits[p]) || 0
            } else if (editSplitMode === 'percentage') {
              cleanedSplits[p] = parseFloat(editSplits[p]) || 0
            } else if (editSplitMode === 'exact') {
              cleanedSplits[p] = parseFloat(editSplits[p]) || 0
            } else {
              cleanedSplits[p] = !!editSplits[p]
            }
          })
          return { ...item, splitMode: editSplitMode, splits: cleanedSplits }
        }
        return item
      })
    )
    setEditingItem(null)
  }

  const isItemUnassigned = (item) => isItemUnassignedPure(item, people)

  const handleFinalize = () => {
    if (items.length === 0) {
      alert('Please add at least one item first.')
      return
    }
    const unassignedItems = items.filter(isItemUnassigned)
    if (unassignedItems.length > 0) {
      alert(`Cannot finalize. The following items have no assignees:\n${unassignedItems.map(item => `• ${item.name || 'Unnamed Item'}`).join('\n')}\n\nPlease assign at least one person to each item.`)
      return
    }
    setStep('results')
  }

  const results = calculateResults({ people, items, taxInput, tipInput, tipIsPercentage })

  // Generate clipboard summary text
  const getShareableText = () => {
    let text = `⚡ BILL SPLIT BREAKDOWN ⚡\n`
    text += `===========================\n`
    items.forEach(item => {
      text += `- ${item.name}: $${item.price.toFixed(2)} (${item.splitMode} split)\n`
    })
    text += `---------------------------\n`
    text += `Subtotal: $${results.totalSubtotal.toFixed(2)}\n`
    text += `Tax: $${results.absoluteTax.toFixed(2)}\n`
    text += `Tip: $${results.absoluteTip.toFixed(2)} (${tipIsPercentage ? `${tipInput}%` : 'flat rate'})\n`
    text += `Grand Total: $${results.grandTotal.toFixed(2)}\n`
    text += `===========================\n`
    
    results.breakdown.forEach(person => {
      text += `• ${person.name}: $${person.total.toFixed(2)}\n`
      text += `  (Sub: $${person.subtotal.toFixed(2)} | Tax: $${person.taxShare.toFixed(2)} | Tip: $${person.tipShare.toFixed(2)})\n`
    })
    text += `===========================\n`
    text += `Split using Antigravity Bill Splitter`
    return text
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareableText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  return (
    <div className="min-h-screen bg-background text-primary font-sans antialiased flex flex-col transition-colors duration-200">
      
      {/* Top Navbar */}
      <header className="fixed top-0 w-full z-40 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-border transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors flex items-center gap-1.5 shrink-0"
              title="Open Split Sessions Menu"
            >
              <Menu className="w-5 h-5" />
              <Folder className="w-4 h-4 text-muted hidden sm:inline" />
            </button>
            
            {step !== 'upload' && (
              <button 
                onClick={() => {
                  if (step === 'crop') setStep('upload')
                  else if (step === 'scanning') setStep('crop')
                  else if (step === 'items') setStep('upload')
                  else if (step === 'results') setStep('items')
                }}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors shrink-0"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            
            <span className="font-semibold text-sm truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[280px]" title={activeSplit.name}>
              {activeSplit.name}
            </span>
            <button
              onClick={() => {
                const newName = prompt('Rename this split:', activeSplit.name)
                if (newName === null) return
                const trimmed = newName.trim()
                if (!trimmed) return
                setSplits(prev => prev.map(s => s.id === activeSplit.id ? { ...s, name: trimmed } : s))
              }}
              className="p-1 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors shrink-0"
              title="Rename active split"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 animate-in fade-in">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors"
              title="Toggle Light/Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 pt-24 pb-20 px-4 max-w-4xl w-full mx-auto flex flex-col justify-start">
        

        {/* Step 1: Upload / Choose Receipt Source */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col justify-center items-center py-12 max-w-md mx-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-accent mb-6 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">Scan & Split Bills</h1>
            <p className="text-sm text-muted text-center mb-8 max-w-xs">
              Upload or snap a receipt photo. Our client-side OCR engine will extract line items automatically.
            </p>

            <div className="flex flex-col gap-3 w-full">
              {/* Camera trigger */}
              <label className="flex items-center justify-center gap-3 bg-accent text-white font-medium text-sm rounded-xl py-4 px-6 hover:bg-accent/90 cursor-pointer shadow-sm hover:shadow transition-all text-center">
                <Camera className="w-5 h-5" />
                Take Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>

              {/* Gallery upload */}
              <label className="flex items-center justify-center gap-3 bg-surface border border-border font-medium text-sm rounded-xl py-4 px-6 hover:bg-surface/80 cursor-pointer transition-colors text-center text-primary">
                <Upload className="w-5 h-5" />
                Upload from Gallery
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>

              {/* Skip Scanning */}
              <button
                onClick={() => {
                  setItems([])
                  setStep('items')
                }}
                className="text-xs text-muted hover:text-primary transition-colors text-center py-2 mt-4"
              >
                Skip scanning & enter items manually
              </button>

            </div>

            {/* Offline processing notice */}
            <div className="mt-12 flex gap-2 items-center bg-surface border border-border p-3 rounded-lg text-xs text-muted max-w-xs">
              <Info className="w-4 h-4 shrink-0 text-accent" />
              <span>All OCR processing runs locally on your browser. Your images are never sent to a backend server.</span>
            </div>
          </div>
        )}

        {/* Step 2: Interactive Cropper */}
        {step === 'crop' && (
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight">Crop Receipt</h2>
              <p className="text-xs text-muted">Crop to focus on item names and prices for better accuracy.</p>
            </div>

            {/* Cropper View Container */}
            <div className="relative bg-black rounded-xl overflow-hidden max-h-[60vh] border border-border flex items-center justify-center">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Receipt to Crop"
                className="max-w-full max-h-[55vh] object-contain select-none block"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 border border-border rounded-xl py-3 text-sm font-medium hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropAndScan}
                className="flex-1 bg-accent text-white font-medium text-sm rounded-xl py-3 hover:bg-accent/90 shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Crop className="w-4 h-4" />
                Crop & Scan
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Scanning Screen */}
        {step === 'scanning' && (
          <div className="flex-1 flex flex-col justify-center items-center py-20">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <h3 className="text-lg font-bold tracking-tight text-center mb-1">{scanStatus}</h3>
            <p className="text-xs text-muted text-center mb-6">Processing locally on your device...</p>
            
            <div className="w-full max-w-xs bg-surface border border-border h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
            <span className="text-xs text-accent font-semibold mt-2">{scanProgress}%</span>
          </div>
        )}

        {/* Step 4: Add items / Split Assignment Screen */}
        {step === 'items' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Column 1: Configs, People, Items (Col span 3) */}
            <div className="md:col-span-3 space-y-6">
              
              {/* People Section */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-muted flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    People
                  </h3>
                  <span className="text-xs font-mono text-muted">{people.length} active</span>
                </div>

                {/* Grid chips list */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {people.map((person) => (
                    <span 
                      key={person}
                      className="inline-flex items-center gap-1 bg-background border border-border rounded-lg pl-3 pr-1.5 py-1 text-sm font-medium"
                    >
                      {person}
                      <button 
                        onClick={() => handleRemovePerson(person)}
                        className="text-muted hover:text-red-500 rounded-md p-0.5 hover:bg-surface transition-colors"
                        title={`Remove ${person}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new person form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add name..."
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                  <button
                    onClick={handleAddPerson}
                    className="bg-accent text-white text-sm font-medium rounded-lg px-4 py-1.5 hover:bg-accent/90 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-muted flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Items & Assignment
                  </h3>
                  <button
                    onClick={handleAddItem}
                    className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center bg-surface/50">
                    <p className="text-sm text-muted mb-2">No items listed yet.</p>
                    <button
                      onClick={handleAddItem}
                      className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg hover:bg-accent/90 transition-colors"
                    >
                      Add your first item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div 
                        key={item.id}
                        className={`rounded-xl border bg-surface p-4 space-y-3 transition-colors ${
                          isItemUnassigned(item)
                            ? 'border-red-500/40 hover:border-red-500/60 dark:border-red-500/30'
                            : 'border-border hover:border-accent/30'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            className="flex-1 bg-background border border-transparent hover:border-border focus:border-accent rounded-lg px-2 py-1 text-sm font-semibold outline-none transition-colors min-w-0"
                          />
                          {isItemUnassigned(item) && (
                            <span className="text-[10px] text-red-500 font-mono font-bold bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md shrink-0 self-center">
                              Unassigned
                            </span>
                          )}
                          <div className="flex items-center bg-background border border-border rounded-lg px-2 py-1 w-24 shrink-0">
                            <span className="text-xs text-muted mr-0.5 font-mono">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.price || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                              className="w-full bg-transparent text-right text-sm font-mono outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-muted hover:text-red-500 rounded-lg p-1.5 hover:bg-background transition-colors shrink-0"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-muted mr-1">Split:</span>
                          
                          {people.map((person) => {
                            const isSelected = item.splitMode === 'equal' && item.splits[person] === true
                            const isCustom = item.splitMode !== 'equal'
                            
                            return (
                              <button
                                key={person}
                                onClick={() => togglePersonOnItem(item.id, person)}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                  isCustom
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                    : isSelected
                                    ? 'bg-accent/15 border-accent/40 text-accent font-semibold'
                                    : 'bg-background border-border text-muted hover:text-primary hover:border-muted/50'
                                }`}
                              >
                                {person}
                                {isCustom && (
                                  <span className="text-[10px] opacity-75 ml-1 font-mono">
                                    {item.splitMode === 'shares' ? `${item.splits[person] || 0}sh` : ''}
                                    {item.splitMode === 'percentage' ? `${item.splits[person] || 0}%` : ''}
                                    {item.splitMode === 'exact' ? `$${(item.splits[person] || 0).toFixed(0)}` : ''}
                                  </span>
                                )}
                              </button>
                            )
                          })}

                          <button
                            onClick={() => openCustomSplitEditor(item)}
                            className={`ml-auto text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                              item.splitMode !== 'equal'
                                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                                : 'bg-background border-border text-muted hover:text-primary hover:bg-surface'
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                            {item.splitMode === 'equal' ? 'Details' : 'Custom'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Bill Summary, Taxes, Preview & Finalize (Col span 2) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Receipt Preview Card */}
              {croppedImage && (
                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-muted flex items-center justify-between">
                    <span>Receipt Image</span>
                    <span className="text-[10px] text-accent font-mono font-bold uppercase">Stored locally</span>
                  </h3>
                  
                  <div className="relative group overflow-hidden rounded-lg border border-border bg-black max-h-48 flex items-center justify-center cursor-pointer" onClick={() => setShowReceiptPreviewModal(true)}>
                    <img 
                      src={croppedImage} 
                      alt="Scanned Receipt" 
                      className="max-h-48 object-contain transition-transform group-hover:scale-105 duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-150">
                      Click to expand
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Constants Panel */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  Tax & Tip Config
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted font-medium flex justify-between">
                    <span>Tax (Absolute Amount)</span>
                    <span className="font-mono text-[10px]">Applied proportionally</span>
                  </label>
                  <div className="flex items-center bg-background border border-border rounded-lg px-3 py-2 w-full focus-within:border-accent transition-colors">
                    <span className="text-sm text-muted mr-1 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={taxInput}
                      onChange={(e) => setTaxInput(e.target.value)}
                      className="w-full bg-transparent text-sm font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted font-medium flex justify-between">
                    <span>Tip / Gratuity</span>
                    <span className="font-mono text-[10px]">Based on subtotal</span>
                  </label>
                  <div className="flex">
                    <div className="flex items-center bg-background border border-border border-r-0 rounded-l-lg px-3 py-2 flex-1 focus-within:border-accent transition-colors">
                      {!tipIsPercentage && <span className="text-sm text-muted mr-1 font-mono">$</span>}
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={tipInput}
                        onChange={(e) => setTipInput(e.target.value)}
                        className="w-full bg-transparent text-sm font-mono outline-none"
                      />
                      {tipIsPercentage && <span className="text-sm text-muted ml-1 font-mono">%</span>}
                    </div>
                    <button
                      onClick={() => setTipIsPercentage(!tipIsPercentage)}
                      className="border border-border bg-background border-l-0 hover:bg-surface px-3 rounded-r-lg text-xs font-bold text-muted hover:text-primary transition-colors font-mono"
                    >
                      {tipIsPercentage ? '%' : '$'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Math Summary Widget */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">Bill Summary</h3>
                
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Items Subtotal:</span>
                    <span>${results.totalSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Proportional Tax:</span>
                    <span>${results.absoluteTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Proportional Tip:</span>
                    <span>${results.absoluteTip.toFixed(2)}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total Bill:</span>
                    <span className="text-accent">${results.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleFinalize}
                  className="w-full bg-accent text-white font-medium text-sm rounded-xl py-3.5 hover:bg-accent/90 shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Finalize Splits
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Step 5: Final Splits & Breakdown Summary */}
        {step === 'results' && (
          <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
            
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-accent/10 border border-accent/20 rounded-full text-accent">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Splits Finalized</h2>
              <p className="text-sm text-muted">Here is the individual cost breakdown for this session.</p>
            </div>

            {/* Clean Monospaced Receipt Breakdown Card */}
            <div className="rounded-xl border border-border bg-surface p-6 font-mono text-sm space-y-4 shadow-sm">
              <div className="text-center font-bold text-lg border-b border-border pb-3">
                RECEIPT SUMMARY
              </div>
              
              <div className="space-y-3 pt-2">
                {results.breakdown.map((person) => (
                  <div key={person.name} className="space-y-1">
                    <div className="flex justify-between font-bold text-base">
                      <span>{person.name}</span>
                      <span className="text-accent">${person.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted pl-4">
                      <span>Items: ${person.subtotal.toFixed(2)} | Tax: ${person.taxShare.toFixed(2)} | Tip: ${person.tipShare.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-xs text-muted">
                <div className="flex justify-between">
                  <span>Grand Subtotal</span>
                  <span>${results.totalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grand Tax</span>
                  <span>${results.absoluteTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grand Tip</span>
                  <span>${results.absoluteTip.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-primary pt-1">
                  <span>Sum of All Splits</span>
                  <span>${results.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Sharing CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-surface border border-border rounded-xl py-3.5 text-sm font-medium hover:bg-surface/80 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied to Clipboard!' : 'Copy Summary for Venmo'}
              </button>
              
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Bill Split Breakdown',
                      text: getShareableText()
                    }).catch(console.error)
                  } else {
                    copyToClipboard()
                  }
                }}
                className="bg-accent text-white font-medium text-sm rounded-xl py-3.5 px-6 hover:bg-accent/90 shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('items')}
                className="text-xs text-muted hover:text-primary transition-colors py-2"
              >
                Go back & edit items or splits
              </button>
            </div>
          </div>
        )}

      </main>

      {/* CUSTOM SPLIT MODAL (Detail View) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-black border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-muted">Advanced Split</span>
                <h4 className="font-bold text-base truncate">{editingItem.name}</h4>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-muted hover:text-primary hover:bg-surface rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex justify-between items-center text-sm font-mono">
                <span className="text-muted">Item Price:</span>
                <span className="font-bold text-accent">${editingItem.price.toFixed(2)}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Split Mode</label>
                <div className="grid grid-cols-4 gap-1 border border-border bg-surface p-1 rounded-xl">
                  {['equal', 'shares', 'percentage', 'exact'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setEditSplitMode(mode)
                        const initialSplits = {}
                        people.forEach(p => {
                          if (mode === 'shares') initialSplits[p] = 1
                          else if (mode === 'percentage') initialSplits[p] = people.length > 0 ? (100 / people.length).toFixed(1) : 0
                          else if (mode === 'exact') initialSplits[p] = people.length > 0 ? (editingItem.price / people.length).toFixed(2) : 0
                          else initialSplits[p] = true
                        })
                        setEditSplits(initialSplits)
                      }}
                      className={`text-[10px] uppercase font-bold py-2 rounded-lg text-center transition-colors ${
                        editSplitMode === mode
                          ? 'bg-accent text-white shadow-xs'
                          : 'text-muted hover:text-primary'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {people.map((person) => {
                  return (
                    <div key={person} className="flex items-center justify-between bg-surface border border-border/40 rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{person}</span>

                      {editSplitMode === 'equal' && (
                        <input
                          type="checkbox"
                          checked={!!editSplits[person]}
                          onChange={(e) => setEditSplits({ ...editSplits, [person]: e.target.checked })}
                          className="w-5 h-5 accent-accent cursor-pointer"
                        />
                      )}

                      {editSplitMode === 'shares' && (
                        <div className="flex items-center bg-background border border-border rounded-lg">
                          <button
                            onClick={() => {
                              const curr = parseInt(editSplits[person]) || 0
                              setEditSplits({ ...editSplits, [person]: Math.max(0, curr - 1) })
                            }}
                            className="px-2 py-1 hover:bg-surface text-sm border-r border-border font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editSplits[person]}
                            onChange={(e) => setEditSplits({ ...editSplits, [person]: parseInt(e.target.value) || 0 })}
                            className="w-12 bg-transparent text-center text-sm font-mono outline-none"
                          />
                          <button
                            onClick={() => {
                              const curr = parseInt(editSplits[person]) || 0
                              setEditSplits({ ...editSplits, [person]: curr + 1 })
                            }}
                            className="px-2 py-1 hover:bg-surface text-sm border-l border-border font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {editSplitMode === 'percentage' && (
                        <div className="flex items-center bg-background border border-border rounded-lg px-2 py-1 w-24">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editSplits[person]}
                            onChange={(e) => setEditSplits({ ...editSplits, [person]: e.target.value })}
                            className="w-full bg-transparent text-right text-sm font-mono outline-none"
                          />
                          <span className="text-xs text-muted ml-0.5 font-mono">%</span>
                        </div>
                      )}

                      {editSplitMode === 'exact' && (
                        <div className="flex items-center bg-background border border-border rounded-lg px-2 py-1 w-24">
                          <span className="text-xs text-muted mr-0.5 font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={editingItem.price}
                            value={editSplits[person]}
                            onChange={(e) => setEditSplits({ ...editSplits, [person]: e.target.value })}
                            className="w-full bg-transparent text-right text-sm font-mono outline-none"
                          />
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>

              {editSplitMode === 'percentage' && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Total Sum:</span>
                  <span className={Math.abs(Object.values(editSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0) - 100) < 0.01 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {Object.values(editSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0).toFixed(1)}% / 100%
                  </span>
                </div>
              )}
              {editSplitMode === 'exact' && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Allocated:</span>
                  <span className={Math.abs(Object.values(editSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0) - editingItem.price) < 0.02 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    ${Object.values(editSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0).toFixed(2)} / ${editingItem.price.toFixed(2)}
                  </span>
                </div>
              )}

            </div>

            <div className="border-t border-border p-4 bg-surface flex gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 border border-border bg-background rounded-xl py-2.5 text-sm font-medium hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomSplit}
                className="flex-1 bg-accent text-white font-medium text-sm rounded-xl py-2.5 hover:bg-accent/90 shadow-sm transition-colors"
              >
                Save Splits
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LEFT DRAWER (Split sessions list) */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        />

        {/* Drawer container */}
        <div 
          className={`absolute inset-y-0 left-0 w-80 max-w-[90vw] bg-white dark:bg-black border-r border-border p-5 flex flex-col justify-between shadow-2xl transition-transform duration-200 ease-out transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Drawer Header */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Sessions manager</span>
                <h3 className="text-lg font-bold">Split Sessions</h3>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split List (scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {splits.map((s) => {
                const isActive = s.id === activeSplit.id
                const isRenaming = renamingSplitId === s.id

                return (
                  <div 
                    key={s.id}
                    className={`group rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                      isActive 
                        ? 'border-accent/40 bg-accent/5 dark:bg-accent/10 shadow-xs' 
                        : 'border-border/50 hover:border-border hover:bg-surface'
                    }`}
                  >
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(s.id)
                            if (e.key === 'Escape') setRenamingSplitId(null)
                          }}
                          className="flex-1 bg-background border border-accent rounded-lg px-2 py-1 text-sm font-semibold outline-none min-w-0"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleSaveRename(s.id)}
                          className="p-1 text-green-500 hover:bg-background rounded-md transition-colors shrink-0"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setRenamingSplitId(null)}
                          className="p-1 text-muted hover:bg-background rounded-md transition-colors shrink-0"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setCurrentSplitId(s.id)
                            setIsSidebarOpen(false)
                          }}
                          className="flex-1 text-left min-w-0 font-semibold text-sm hover:text-accent transition-colors truncate"
                        >
                          {s.name}
                        </button>
                        
                        <div className="flex items-center gap-1 opacity-60 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRenameSplit(s.id, s.name)}
                            className="p-1 text-muted hover:text-primary hover:bg-background rounded-md transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (splits.length <= 1) {
                                if (confirm('Are you sure you want to delete this split? All data for this split will be cleared.')) {
                                  const resetSplit = createNewSplitObject('My First Split')
                                  setSplits([resetSplit])
                                  setCurrentSplitId(resetSplit.id)
                                  setIsSidebarOpen(false)
                                }
                                return
                              }
                              if (confirm(`Are you sure you want to delete the split "${s.name}"?`)) {
                                const remaining = splits.filter(item => item.id !== s.id)
                                setSplits(remaining)
                                if (isActive) {
                                  setCurrentSplitId(remaining[0].id)
                                }
                              }
                            }}
                            className="p-1 text-muted hover:text-red-500 hover:bg-background rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata line */}
                    <div className="text-[10px] text-muted flex justify-between font-mono">
                      <span>{s.people.length} people · {s.items.length} items</span>
                      <span>${calculateResults(s).grandTotal.toFixed(2)} total</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="border-t border-border pt-4 bg-background shrink-0">
            <button
              onClick={() => {
                const name = prompt('Enter a name for the new split:')
                if (name === null) return
                const newSplit = createNewSplitObject(name.trim())
                setSplits(prev => [...prev, newSplit])
                setCurrentSplitId(newSplit.id)
                setIsSidebarOpen(false)
              }}
              className="w-full bg-accent text-white hover:bg-accent/90 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Split</span>
            </button>
          </div>
        </div>
      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {showReceiptPreviewModal && croppedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-white dark:bg-black border border-border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <div className="border-b border-border p-4 flex items-center justify-between bg-surface">
              <h4 className="font-bold text-base">Receipt Reference</h4>
              <button 
                onClick={() => setShowReceiptPreviewModal(false)}
                className="text-muted hover:text-primary hover:bg-background rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-black">
              <img 
                src={croppedImage} 
                alt="Receipt Reference" 
                className="max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// Simple wrapper component for PlusCircle icon to avoid naming crashes
function PlusCircleIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Pure calculation helper for unit tests & component render
export function calculateResults({ people, items, taxInput, tipInput, tipIsPercentage }) {
  const individualSubtotals = {}
  people.forEach(p => {
    individualSubtotals[p] = 0
  })

  items.forEach(item => {
    const price = item.price
    if (item.splitMode === 'equal') {
      const selectedPeople = people.filter(p => item.splits[p] === true)
      const sharePrice = selectedPeople.length > 0 ? price / selectedPeople.length : 0
      selectedPeople.forEach(p => {
        individualSubtotals[p] += sharePrice
      })
    } else if (item.splitMode === 'shares') {
      const totalShares = people.reduce((sum, p) => sum + (item.splits[p] || 0), 0)
      people.forEach(p => {
        const shares = item.splits[p] || 0
        const sharePrice = totalShares > 0 ? (shares / totalShares) * price : 0
        individualSubtotals[p] += sharePrice
      })
    } else if (item.splitMode === 'percentage') {
      people.forEach(p => {
        const pct = item.splits[p] || 0
        individualSubtotals[p] += (pct / 100) * price
      })
    } else if (item.splitMode === 'exact') {
      people.forEach(p => {
        const amt = item.splits[p] || 0
        individualSubtotals[p] += amt
      })
    }
  })

  const totalSubtotal = Object.values(individualSubtotals).reduce((sum, val) => sum + val, 0)

  const absoluteTax = parseFloat(taxInput) || 0
  const taxRate = totalSubtotal > 0 ? absoluteTax / totalSubtotal : 0

  let absoluteTip = 0
  const tipVal = parseFloat(tipInput) || 0
  if (tipIsPercentage) {
    absoluteTip = totalSubtotal * (tipVal / 100)
  } else {
    absoluteTip = tipVal
  }
  const tipRate = totalSubtotal > 0 ? absoluteTip / totalSubtotal : 0

  const breakdown = people.map(person => {
    const subtotal = individualSubtotals[person]
    const taxShare = subtotal * taxRate
    const tipShare = subtotal * tipRate
    const total = subtotal + taxShare + tipShare

    return {
      name: person,
      subtotal,
      taxShare,
      tipShare,
      total
    }
  })

  const grandTotal = totalSubtotal + absoluteTax + absoluteTip

  return {
    totalSubtotal,
    absoluteTax,
    absoluteTip,
    grandTotal,
    breakdown
  }
}

// Pure helper to check if an item has no assignees
export function isItemUnassignedPure(item, people) {
  if (item.splitMode === 'equal') {
    return !people.some(p => item.splits[p] === true)
  } else if (item.splitMode === 'shares') {
    return !people.some(p => (item.splits[p] || 0) > 0)
  } else if (item.splitMode === 'percentage') {
    return !people.some(p => (item.splits[p] || 0) > 0)
  } else if (item.splitMode === 'exact') {
    return !people.some(p => (item.splits[p] || 0) > 0)
  }
  return true
}

// Robust price parsing function
export function parsePrice(line) {
  // Try to find decimal matches first (e.g. 12.00, 40.0)
  // Match digits followed by period/comma and 1-2 digits, or space separated cents preceded by dollar sign
  const decimalRegex = /(?:\$|usd)?\b(\d+)[.,](\d{1,2})\b|(?:\$|usd)\s*(\d+)\s+(\d{2})\b/ig;
  const decimalMatches = [...line.matchAll(decimalRegex)];
  if (decimalMatches.length > 0) {
    const lastMatch = decimalMatches[decimalMatches.length - 1];
    const dollars = lastMatch[1] || lastMatch[3];
    const cents = lastMatch[2] || lastMatch[4];
    return {
      price: parseFloat(`${dollars}.${cents}`),
      matchStr: lastMatch[0],
      index: line.lastIndexOf(lastMatch[0])
    };
  }

  // If no decimals, try integer prices (e.g. 19, 6) near the end
  const intRegex = /(?:\$|usd)?\b(\d+)\b(?:\s*[^0-9\s]{1,4})?\s*$/i;
  const intMatch = line.match(intRegex);
  if (intMatch) {
    return {
      price: parseFloat(intMatch[1]),
      matchStr: intMatch[0],
      index: line.lastIndexOf(intMatch[0])
    };
  }

  return null;
}

// Pure parsing logic that takes text and extracts items, tax, and tip
export function parseReceiptTextPure(text) {
  const lines = text.split('\n')
  const parsedItems = []
  let detectedSubtotal = null
  let detectedTax = null
  let detectedTip = null
  let detectedGrandTotal = null

  // Clean up empty lines
  const cleanedLines = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)

  // Regexes for common metadata formats to ignore
  const dateRegex = /\b\d{1,4}[-/]\d{1,4}[-/]\d{2,4}\b/;
  const phoneRegex = /\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const timeRegex = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i;
  const monthRegex = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i;
  const zipRegex = /\b\d{5}(?:-\d{4})?\b/;

  const footerKeywords = [
    'subtotal', 'sub total', 'sub-total', 'complete subtotal', 'sbtotal', 'sbtl',
    'total', 'amount due', 'balance due', 'total due', 'grand total',
    'tax', 'sales tax', 'vat', 'gst', 'pst', 'tox',
    'tip', 'gratuity', 'service charge',
    'due', 'es :'
  ];

  const metadataKeywords = [
    'date', 'time', 'server', 'cashier', 'table', 'guest', 'guests', 'check', 'order #', 'order:', 'reprint',
    'tel', 'phone', 'address', 'avenue', 'street', 'road', 'suite', 'www.', 'http', 'station:', 'dine in',
    'ticket #', 'ticket:', 'togo', 't0g0', 'to-go',
    'visa', 'chase', 'mastercard', 'amex', 'card', 'auth', 'authorization', 'aid', 'cafe', 'café', 'cpa', 'v4',
    'markdown', 'harkdoun', 'plu#', 'plu '
  ];

  // Locate the logical boundaries of the "items area"
  let endOfItemsIndex = cleanedLines.length
  for (let i = 0; i < cleanedLines.length; i++) {
    const lowerLine = cleanedLines[i].toLowerCase()
    if (footerKeywords.some(keyword => lowerLine.includes(keyword))) {
      endOfItemsIndex = i
      break
    }
  }

  let startOfItemsIndex = 0
  for (let i = 0; i < endOfItemsIndex; i++) {
    const lowerLine = cleanedLines[i].toLowerCase()
    if (
      lowerLine.includes('qty') || 
      lowerLine.includes('item') || 
      lowerLine.includes('price') || 
      lowerLine.includes('desc')
    ) {
      startOfItemsIndex = i + 1
      break
    }
  }

  // Fallback if index boundaries are invalid
  if (startOfItemsIndex >= endOfItemsIndex) {
    startOfItemsIndex = 0
  }

  // Extract item lines
  const itemLines = cleanedLines.slice(startOfItemsIndex, endOfItemsIndex)

  itemLines.forEach((line) => {
    const lower = line.toLowerCase();
    
    // Skip receipt metadata lines and non-item noise
    if (
      line.match(dateRegex) ||
      line.match(phoneRegex) ||
      line.match(timeRegex) ||
      line.match(monthRegex) ||
      line.match(zipRegex) ||
      lower.includes('00 00 00') ||
      metadataKeywords.some(keyword => lower.includes(keyword))
    ) {
      return;
    }

    // Skip unit price sub-lines, descriptions, or options in brackets/parentheses
    if (
      lower.includes('each') || 
      lower.includes('per') || 
      lower.match(/\d\]\s*$/) || // ends in digit + ] (like Tofu $3.00])
      lower.endsWith(')') ||
      (lower.startsWith('(') && lower.endsWith(')')) ||
      (lower.startsWith('[') && lower.endsWith(']'))
    ) {
      return;
    }

    // Skip weight sub-lines common on grocery receipts (e.g., "1.72 lb @ $3.49/lb")
    if (lower.match(/\d+\.?\d*\s*(lb|1b)\s*@/) || lower.match(/^\s*(lb|1b)\s*@/)) {
      return;
    }

    const priceInfo = parsePrice(line);
    if (priceInfo) {
      const price = priceInfo.price;
      
      // Extract the name part before the matched price
      let name = line.substring(0, priceInfo.index).trim();
      
      // Clean leading quantity, code prefixes, and trailing/leading punctuation
      const prefixesToClean = /^(?:ddl|n\/a|ll|l|burg|bbs|scr|din\s+bf|din|hb|sd|sb\s+ca|sb|sub)\b\s*/i;
      
      name = name
        .replace(/[§\u00A7*:;|=_]/g, '') // clean structural/noise symbols globally
        .replace(/^[.-]+/, '') // clean leading periods/hyphens
        .replace(/[.-]+$/, '') // clean trailing periods/hyphens
        .trim()
        .replace(/^\d+\s+/, '') // leading quantity digits like "1 "
        .replace(/^x\d+\s+/i, '') // leading quantity with x like "x1 " or "x2 "
        .replace(prefixesToClean, '') // dynamic prefix tags
        .replace(/^[a-z]\d{1,3}\b\.?\s*/i, '') // code prefix like "S1.", "T3.", "C12."
        .replace(/^\d+(\.\d+)*\.?\s*/, '') // leading index numbers like "30." or "1.109."
        .replace(/\(\s*\(?\$?\s*\d+(?:[.,\s]\d{1,2})?\s*(?:each|per)?\s*\)?/ig, '') // parenthesized unit price info (closing paren optional)
        .trim();

      if (price > 0 && price < 1000) { // filter out Zip Code false positives or weird noise prices > $1000
        if (!name) {
          name = `Item $${price.toFixed(2)}`;
        }
        parsedItems.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          price: price
        });
      }
    }
  });

  // Mathematical fallback: if we find an item whose price is equal to the sum of all items before it,
  // it is actually a Subtotal line that got treated as an item. Truncate items at that index.
  let runningSum = 0;
  for (let i = 0; i < parsedItems.length; i++) {
    const price = parsedItems[i].price;
    // Allow small decimal tolerance
    if (i > 0 && Math.abs(runningSum - price) < 0.05) {
      // Truncate!
      parsedItems.splice(i);
      break;
    }
    runningSum += price;
  }

  // Parse totals, tax, and tip from the footer section lines
  const footerLines = cleanedLines.slice(endOfItemsIndex)
  footerLines.forEach((line) => {
    // Skip suggested tip calculations that contain '=' or '%' (to avoid double tip summing)
    if (line.includes('=')) {
      return;
    }

    const lowerLine = line.toLowerCase()
    const priceInfo = parsePrice(line)
    if (priceInfo) {
      const price = priceInfo.price

      if (
        lowerLine.includes('subtotal') || 
        lowerLine.includes('sub total') || 
        lowerLine.includes('complete subtotal') || 
        lowerLine.includes('es :') ||
        (lowerLine.includes('total') && lowerLine.includes('item'))
      ) {
        if (detectedSubtotal === null) detectedSubtotal = price
      } else if (
        lowerLine.includes('tax') || 
        lowerLine.includes('sales tax') || 
        lowerLine.includes('vat') ||
        lowerLine.includes('gst') ||
        lowerLine.includes('pst') ||
        lowerLine.includes('tox')
      ) {
        if (detectedTax === null) detectedTax = price
      } else if (
        lowerLine.includes('tip') || 
        lowerLine.includes('tips') || 
        lowerLine.includes('gratuity') ||
        lowerLine.includes('service charge') ||
        lowerLine.includes('charge')
      ) {
        // If we have service charge and tip, we can sum them up!
        if (detectedTip === null) {
          detectedTip = price
        } else {
          detectedTip += price
        }
      } else if (
        lowerLine.includes('total') || 
        lowerLine.includes('tota') || 
        lowerLine.includes('totl') || 
        lowerLine.includes('amount due') || 
        lowerLine.includes('balance due') ||
        lowerLine.includes('due')
      ) {
        if (detectedGrandTotal === null || price > detectedGrandTotal) {
          detectedGrandTotal = price
        }
      }
    }
  })

  // Mathematical fallback for missing or unparsed tip (e.g. Blue Moose Cafe where tip line is garbled)
  if (detectedTip === null && detectedGrandTotal !== null && detectedSubtotal !== null) {
    const diff = detectedGrandTotal - detectedSubtotal - (detectedTax || 0);
    if (diff > 0.05) {
      detectedTip = diff;
    }
  }

  return {
    items: parsedItems,
    tax: detectedTax,
    tip: detectedTip,
    subtotal: detectedSubtotal,
    grandTotal: detectedGrandTotal
  };
}
