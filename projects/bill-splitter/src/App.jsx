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
  Folder,
  Link2,
  AlertCircle,
  ChevronDown,
  ChevronUp
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

  // Extract share token from URL (?s=... or #s=...) if present
  const initialShareParam = typeof window !== 'undefined' ? getShareParamFromLocation(window.location) : null
  const initialSharedSplit = initialShareParam ? decodeSharePayload(initialShareParam) : null

  const [splits, setSplits] = useState(() => {
    let baseSplits = []
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bill_splits')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            baseSplits = parsed
          }
        } catch (e) {
          console.error("Failed to parse saved splits", e)
        }
      }
    }
    if (baseSplits.length === 0) {
      baseSplits = [createNewSplitObject('My First Split')]
    }
    if (initialSharedSplit) {
      const existing = baseSplits.find(s => s.shareToken && s.shareToken === initialShareParam)
      if (!existing) {
        return [...baseSplits, { ...initialSharedSplit, shareToken: initialShareParam }]
      }
    }
    return baseSplits
  })

  const [currentSplitId, setCurrentSplitId] = useState(() => {
    if (initialSharedSplit && initialShareParam) {
      const match = splits.find(s => s.shareToken && s.shareToken === initialShareParam)
      if (match) return match.id
    }
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('current_split_id')
      if (savedId && splits.some(s => s.id === savedId)) {
        return savedId
      }
    }
    return splits[0].id
  })

  // Clean share token from browser address bar after importing so refreshes stay clean
  useEffect(() => {
    if (typeof window !== 'undefined' && initialShareParam) {
      const url = new URL(window.location.href)
      url.searchParams.delete('s')
      if (url.hash.startsWith('#s=')) url.hash = ''
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
  }, [])

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

  // Get active split data
  const activeSplit = splits.find(s => s.id === currentSplitId) || splits[0] || createNewSplitObject()

  // Load images from IndexedDB when switching splits or reloading
  useEffect(() => {
    let active = true
    const targetSplitId = currentSplitId
    const loadImages = async () => {
      const srcImg = await getImageFromDB(`${targetSplitId}_src`)
      const cropImg = await getImageFromDB(`${targetSplitId}_cropped`)
      if (active) {
        setSplits(prevSplits => prevSplits.map(s => {
          if (s.id !== targetSplitId) return s
          const updates = {}
          if (srcImg && srcImg !== s.imageSrc) updates.imageSrc = srcImg
          if (cropImg && cropImg !== s.croppedImage) updates.croppedImage = cropImg
          return Object.keys(updates).length > 0 ? { ...s, ...updates } : s
        }))
      }
    }
    loadImages()
    return () => {
      active = false
    }
  }, [currentSplitId])

  // Helper to update active split fields
  const updateActiveSplit = (fields) => {
    const targetId = activeSplit.id
    setSplits(prevSplits => prevSplits.map(s => {
      if (s.id === targetId) {
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
  const [isEditingHeaderName, setIsEditingHeaderName] = useState(false)
  const [headerRenameValue, setHeaderRenameValue] = useState('')
  const [isCreatingSplit, setIsCreatingSplit] = useState(false)
  const [newSplitName, setNewSplitName] = useState('')
  const [confirmDeleteSplitId, setConfirmDeleteSplitId] = useState(null)

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
  const [statusMessage, setStatusMessage] = useState(initialSharedSplit ? { type: 'info', text: `Loaded shared split "${initialSharedSplit.name}".` } : null)
  const [modalError, setModalError] = useState(null)
  const [expandedPersonNames, setExpandedPersonNames] = useState({})
  const [showTextPreview, setShowTextPreview] = useState(false)

  // Refs for Image element, Cropper instance, and OCR cancellation token
  const imageRef = useRef(null)
  const cropperRef = useRef(null)
  const scanSessionRef = useRef(0)

  // Custom Split Editor State
  const [editingItem, setEditingItem] = useState(null) // item object
  const [editSplitMode, setEditSplitMode] = useState('equal')
  const [editSplits, setEditSplits] = useState({})
  
  // Clipboard copied confirmation tooltip
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false)

  // Reset transient modals/errors when switching active split
  useEffect(() => {
    scanSessionRef.current += 1
    setEditingItem(null)
    setModalError(null)
    setShowReceiptPreviewModal(false)
    setNewPersonName('')
    setCopied(false)
    setCopiedLink(false)
    setIsEditingHeaderName(false)
    setConfirmDeleteSplitId(null)
    setExpandedPersonNames({})
    setShowTextPreview(false)
  }, [currentSplitId])

  // Close open modals on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (editingItem) {
        setEditingItem(null)
        setModalError(null)
      } else if (showReceiptPreviewModal) {
        setShowReceiptPreviewModal(false)
      } else if (isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editingItem, showReceiptPreviewModal, isSidebarOpen])

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
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) {
      setStatusMessage(null)
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
    const sessionId = ++scanSessionRef.current
    setStatusMessage(null)
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

      const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9)
      if (scanSessionRef.current !== sessionId) return
      setCroppedImage(croppedDataUrl)

      const result = await Tesseract.recognize(
        croppedDataUrl,
        'eng',
        {
          logger: (m) => {
            if (scanSessionRef.current !== sessionId) return
            if (m.status === 'recognizing text') {
              setScanStatus('Extracting receipt items...')
              setScanProgress(Math.round(m.progress * 100))
            } else if (m.status === 'loading tesseract api') {
              setScanStatus('Loading OCR language models...')
            }
          }
        }
      )

      if (scanSessionRef.current !== sessionId) return
      setRawText(result.data.text)
      parseReceiptText(result.data.text)
      setStep('items')
    } catch (err) {
      if (scanSessionRef.current !== sessionId) return
      console.error(err)
      setStatusMessage({ type: 'error', text: 'OCR failed. Please check the image and try again.' })
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
    if (people.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      setStatusMessage({ type: 'error', text: `"${trimmed}" is already in this split.` })
      return
    }
    setStatusMessage(null)
    setPeople([...people, trimmed])
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
    setStatusMessage(null)
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
            updatedVal = Math.max(0, parseFloat(value) || 0)
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

  // Equal split fast toggle; tapping a chip on a custom-split item opens the custom editor instead of silently resetting it
  const togglePersonOnItem = (itemId, personName) => {
    const targetItem = items.find(i => i.id === itemId)
    if (!targetItem) return
    if (targetItem.splitMode !== 'equal') {
      openCustomSplitEditor(targetItem)
      return
    }
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const nextSplits = { ...item.splits, [personName]: !item.splits[personName] }
          return { ...item, splits: nextSplits }
        }
        return item
      })
    )
  }

  // Quick toggle all / none on an item card (resets to equal split)
  const toggleAllOnItem = (itemId) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        const allSelected = item.splitMode === 'equal' && people.length > 0 && people.every(p => item.splits[p] === true)
        const nextSplits = {}
        people.forEach(p => {
          nextSplits[p] = !allSelected
        })
        return { ...item, splitMode: 'equal', splits: nextSplits }
      })
    )
  }

  // Compute balanced default splits when switching modes in the Custom Split Modal
  const buildModeDefaults = (mode, item, currentMode, currentSplits) => {
    const next = {}
    if (people.length === 0) return next

    // Preserve currently active people when moving from equal -> custom so unselected people stay at 0
    const activeEqualPeople = currentMode === 'equal'
      ? people.filter(p => currentSplits[p] === true)
      : []
    const targetPeople = activeEqualPeople.length > 0 ? activeEqualPeople : people

    if (mode === 'equal') {
      people.forEach(p => {
        if (currentMode === 'none') {
          next[p] = true
        } else if (currentMode === 'equal') {
          next[p] = currentSplits[p] === true
        } else {
          next[p] = (parseFloat(currentSplits[p]) || 0) > 0
        }
      })
      return next
    }

    if (mode === 'shares') {
      people.forEach(p => {
        next[p] = targetPeople.includes(p) ? 1 : 0
      })
      return next
    }

    if (mode === 'percentage') {
      const weights = people.map(p => (targetPeople.includes(p) ? 1 : 0))
      const tenths = distributeUnits(1000, weights) // 100.0% in tenths
      people.forEach((p, idx) => {
        next[p] = (tenths[idx] / 10).toFixed(1)
      })
      return next
    }

    if (mode === 'exact') {
      const weights = people.map(p => (targetPeople.includes(p) ? 1 : 0))
      const totalCents = Math.round((Number(item.price) || 0) * 100)
      const cents = distributeUnits(totalCents, weights)
      people.forEach((p, idx) => {
        next[p] = (cents[idx] / 100).toFixed(2)
      })
      return next
    }

    return next
  }

  // Open Custom Split Editor
  const openCustomSplitEditor = (item) => {
    if (people.length === 0) {
      setStatusMessage({ type: 'error', text: 'Add at least one person before configuring a custom split.' })
      return
    }
    setModalError(null)
    setEditingItem(item)
    setEditSplitMode(item.splitMode)

    const initialSplits = {}
    people.forEach(p => {
      if (item.splitMode === 'shares') {
        initialSplits[p] = item.splits[p] !== undefined ? item.splits[p] : 0
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
    setModalError(null)

    if (editSplitMode === 'equal') {
      if (!people.some(p => editSplits[p] === true)) {
        setModalError('Select at least one person for this item.')
        return
      }
    } else if (editSplitMode === 'shares') {
      const totalShares = people.reduce((acc, p) => acc + Math.max(0, parseInt(editSplits[p], 10) || 0), 0)
      if (totalShares <= 0) {
        setModalError('Assign at least 1 total share.')
        return
      }
    } else if (editSplitMode === 'percentage') {
      const sum = people.reduce((acc, p) => acc + Math.max(0, parseFloat(editSplits[p]) || 0), 0)
      if (Math.abs(sum - 100) > 0.05) {
        setModalError(`Percentages must sum to 100%. Current sum: ${sum.toFixed(1)}%`)
        return
      }
    } else if (editSplitMode === 'exact') {
      const sumCents = people.reduce((acc, p) => acc + Math.round(Math.max(0, parseFloat(editSplits[p]) || 0) * 100), 0)
      const priceCents = Math.round((Number(editingItem.price) || 0) * 100)
      if (sumCents !== priceCents) {
        setModalError(`Exact amounts must sum to $${editingItem.price.toFixed(2)}. Current sum: $${(sumCents / 100).toFixed(2)}`)
        return
      }
    }

    setItems(prev =>
      prev.map(item => {
        if (item.id === editingItem.id) {
          const cleanedSplits = {}
          people.forEach(p => {
            if (editSplitMode === 'shares') {
              cleanedSplits[p] = Math.max(0, parseInt(editSplits[p], 10) || 0)
            } else if (editSplitMode === 'percentage') {
              cleanedSplits[p] = Math.max(0, parseFloat(editSplits[p]) || 0)
            } else if (editSplitMode === 'exact') {
              cleanedSplits[p] = roundCents(Math.max(0, parseFloat(editSplits[p]) || 0))
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

  const getItemIssue = (item) => getItemValidationError(item, people)
  const isItemUnassigned = (item) => isItemUnassignedPure(item, people)

  const handleFinalize = () => {
    if (people.length === 0) {
      setStatusMessage({ type: 'error', text: 'Add at least one person before finalizing.' })
      return
    }
    if (items.length === 0) {
      setStatusMessage({ type: 'error', text: 'Add at least one item before finalizing.' })
      return
    }
    const invalidItems = items
      .map(item => ({ item, issue: getItemIssue(item) }))
      .filter(({ issue }) => issue !== null)
    if (invalidItems.length > 0) {
      const summary = invalidItems
        .map(({ item, issue }) => `${item.name || 'Unnamed Item'} (${issue})`)
        .join(', ')
      setStatusMessage({
        type: 'error',
        text: `Fix these items before finalizing: ${summary}.`
      })
      return
    }
    setStatusMessage(null)
    setStep('results')
  }

  const results = calculateResults({ people, items, taxInput, tipInput, tipIsPercentage })

  const getShareUrl = () => {
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : ''
    return buildShareUrl(activeSplit, baseUrl)
  }

  // Generate clipboard summary text with per-person items & shareable link
  const getShareableText = () => {
    return formatShareableText({
      splitName: activeSplit.name,
      results,
      tipInput,
      tipIsPercentage,
      shareUrl: getShareUrl()
    })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareableText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy summary', err)
      setStatusMessage({ type: 'error', text: 'Could not access clipboard. Expand the preview below to copy manually.' })
      setShowTextPreview(true)
    }
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy link', err)
      setStatusMessage({ type: 'error', text: 'Could not copy link to clipboard.' })
      setShowTextPreview(true)
    }
  }


  return (
    <div className="min-h-screen bg-background text-primary font-sans antialiased flex flex-col transition-colors duration-200">
      
      {/* Top Navbar */}
      <header className="fixed top-0 w-full z-40 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-border transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Split Sessions Menu"
              className="p-2 -ml-2 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors flex items-center gap-1.5 shrink-0"
              title="Open Split Sessions Menu"
            >
              <Menu className="w-5 h-5" />
              <Folder className="w-4 h-4 text-muted hidden sm:inline" />
            </button>
            
            {step !== 'upload' && (
              <button 
                onClick={() => {
                  setStatusMessage(null)
                  if (step === 'crop') setStep('upload')
                  else if (step === 'scanning') {
                    scanSessionRef.current += 1
                    setStep('crop')
                  }
                  else if (step === 'items') setStep('upload')
                  else if (step === 'results') setStep('items')
                }}
                aria-label="Go back"
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors shrink-0"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            
            {isEditingHeaderName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const trimmed = headerRenameValue.trim()
                  if (trimmed) {
                    setSplits(prev => prev.map(s => s.id === activeSplit.id ? { ...s, name: trimmed } : s))
                  }
                  setIsEditingHeaderName(false)
                }}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  value={headerRenameValue}
                  onChange={(e) => setHeaderRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsEditingHeaderName(false)}
                  onBlur={() => setIsEditingHeaderName(false)}
                  className="bg-surface border border-accent rounded-lg px-2 py-1 text-sm font-semibold outline-none w-36 sm:w-56"
                  autoFocus
                />
              </form>
            ) : (
              <>
                <span className="font-semibold text-sm truncate max-w-[150px] sm:max-w-[280px]" title={activeSplit.name}>
                  {activeSplit.name}
                </span>
                <button
                  onClick={() => {
                    setHeaderRenameValue(activeSplit.name)
                    setIsEditingHeaderName(true)
                  }}
                  aria-label="Rename active split"
                  className="p-1 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors shrink-0"
                  title="Rename active split"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Light/Dark Mode"
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

        {/* Inline Status / Validation Banner */}
        {statusMessage && (
          <div
            role="alert"
            className={`mb-5 rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
              statusMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-accent/10 border-accent/30 text-accent'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              aria-label="Dismiss message"
              className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
              {items.length > 0 && (
                <button
                  onClick={() => setStep('items')}
                  className="flex items-center justify-center gap-2 bg-surface border border-accent/40 text-accent font-semibold text-sm rounded-xl py-3.5 px-6 hover:bg-accent/10 transition-colors text-center"
                >
                  <FileText className="w-4 h-4" />
                  Continue Current Split ({items.length} {items.length === 1 ? 'item' : 'items'})
                </button>
              )}

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
                {items.length > 0 ? 'Clear items & start manually' : 'Skip scanning & enter items manually'}
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
                        aria-label={`Remove ${person}`}
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
                    onChange={(e) => {
                      setNewPersonName(e.target.value)
                      if (statusMessage?.type === 'error') setStatusMessage(null)
                    }}
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
                    {items.map((item) => {
                      const itemIssue = getItemIssue(item)
                      const allEqualSelected = item.splitMode === 'equal' && people.length > 0 && people.every(p => item.splits[p] === true)
                      return (
                      <div 
                        key={item.id}
                        className={`rounded-xl border bg-surface p-4 space-y-3 transition-colors ${
                          itemIssue
                            ? 'border-red-500/40 hover:border-red-500/60 dark:border-red-500/30'
                            : 'border-border hover:border-accent/30'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            aria-label="Item name"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            className="flex-1 bg-background border border-transparent hover:border-border focus:border-accent rounded-lg px-2 py-1 text-sm font-semibold outline-none transition-colors min-w-0"
                          />
                          {itemIssue && (
                            <span className="text-[10px] text-red-500 font-mono font-bold bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md shrink-0 self-center">
                              {itemIssue}
                            </span>
                          )}
                          <div className="flex items-center bg-background border border-border rounded-lg px-2 py-1 w-24 shrink-0">
                            <span className="text-xs text-muted mr-0.5 font-mono">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              aria-label="Item price"
                              value={item.price || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                              className="w-full bg-transparent text-right text-sm font-mono outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={`Delete ${item.name || 'item'}`}
                            className="text-muted hover:text-red-500 rounded-lg p-1.5 hover:bg-background transition-colors shrink-0"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-muted mr-1">Split:</span>
                          
                          {people.length === 0 ? (
                            <span className="text-xs text-muted italic">Add people above to assign</span>
                          ) : (
                            <>
                              {people.map((person) => {
                                const isSelected = item.splitMode === 'equal' && item.splits[person] === true
                                const isCustom = item.splitMode !== 'equal'
                                const exactAmt = Number(item.splits[person]) || 0
                                const formattedExact = Number.isInteger(exactAmt) ? `$${exactAmt}` : `$${exactAmt.toFixed(2)}`
                                
                                return (
                                  <button
                                    key={person}
                                    onClick={() => togglePersonOnItem(item.id, person)}
                                    title={isCustom ? 'Click to edit custom split' : `Toggle ${person}`}
                                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                      isCustom
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
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
                                        {item.splitMode === 'exact' ? formattedExact : ''}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}

                              <div className="ml-auto flex items-center gap-1.5">
                                {people.length > 1 && (
                                  <button
                                    onClick={() => toggleAllOnItem(item.id)}
                                    className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background text-muted hover:text-primary hover:bg-surface transition-colors font-medium"
                                    title={allEqualSelected ? 'Clear all assignees' : 'Split equally among everyone'}
                                  >
                                    {allEqualSelected ? 'Clear' : 'All'}
                                  </button>
                                )}
                                <button
                                  onClick={() => openCustomSplitEditor(item)}
                                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                                    item.splitMode !== 'equal'
                                      ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                                      : 'bg-background border-border text-muted hover:text-primary hover:bg-surface'
                                  }`}
                                >
                                  <Lock className="w-3 h-3" />
                                  {item.splitMode === 'equal' ? 'Details' : 'Custom'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Bill Summary, Taxes, Preview & Finalize (Col span 2) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Receipt Preview Card */}
              {croppedImage && (
                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">
                      Receipt Image
                    </h3>
                    {imageSrc && (
                      <button
                        onClick={() => setStep('crop')}
                        className="text-[11px] text-accent hover:underline font-medium flex items-center gap-1"
                      >
                        <Crop className="w-3 h-3" /> Re-crop
                      </button>
                    )}
                  </div>
                  
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
                  <label htmlFor="tax-input" className="text-xs text-muted font-medium flex justify-between">
                    <span>Tax (Absolute Amount)</span>
                    <span className="font-mono text-[10px]">Applied proportionally</span>
                  </label>
                  <div className="flex items-center bg-background border border-border rounded-lg px-3 py-2 w-full focus-within:border-accent transition-colors">
                    <span className="text-sm text-muted mr-1 font-mono">$</span>
                    <input
                      id="tax-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={taxInput}
                      onChange={(e) => setTaxInput(e.target.value)}
                      className="w-full bg-transparent text-sm font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tip-input" className="text-xs text-muted font-medium flex justify-between">
                    <span>Tip / Gratuity</span>
                    <span className="font-mono text-[10px]">Based on subtotal</span>
                  </label>
                  <div className="flex">
                    <div className="flex items-center bg-background border border-border border-r-0 rounded-l-lg px-3 py-2 flex-1 focus-within:border-accent transition-colors">
                      {!tipIsPercentage && <span className="text-sm text-muted mr-1 font-mono">$</span>}
                      <input
                        id="tip-input"
                        type="number"
                        min="0"
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
                      aria-label="Toggle tip percentage or dollar amount"
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
              <p className="text-sm text-muted">Here is each person&apos;s itemized breakdown and shareable summary.</p>
            </div>

            {/* Clean Monospaced Receipt Breakdown Card */}
            <div className="rounded-xl border border-border bg-surface p-6 font-mono text-sm space-y-4 shadow-sm">
              <div className="text-center font-bold text-lg border-b border-border pb-3 truncate">
                {activeSplit.name}
              </div>
              
              <div className="space-y-4 pt-1">
                {results.breakdown.map((person) => {
                  const isCollapsed = expandedPersonNames[person.name] === false
                  return (
                  <div key={person.name} className="rounded-xl border border-border/60 bg-background/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setExpandedPersonNames(prev => ({ ...prev, [person.name]: isCollapsed }))}
                        className="flex items-center gap-1.5 font-bold text-base text-left hover:text-accent transition-colors"
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronUp className="w-4 h-4 text-muted" />}
                        <span>{person.name}</span>
                        <span className="text-[11px] font-normal text-muted">
                          ({person.items.length} {person.items.length === 1 ? 'item' : 'items'})
                        </span>
                      </button>
                      <span className="text-accent font-bold text-base">${person.total.toFixed(2)}</span>
                    </div>

                    {!isCollapsed && (
                      <div className="space-y-1 pl-5 text-xs">
                        {person.items.length === 0 ? (
                          <div className="text-muted italic">No items assigned</div>
                        ) : (
                          person.items.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex justify-between gap-2 text-primary/90">
                              <span className="truncate">
                                • {item.name}
                                {item.splitDetail && (
                                  <span className="text-muted ml-1.5">({item.splitDetail})</span>
                                )}
                              </span>
                              <span className="shrink-0">${item.shareAmount.toFixed(2)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <div className="flex justify-between text-[11px] text-muted pl-5 pt-1 border-t border-border/40">
                      <span>Items: ${person.subtotal.toFixed(2)} · Tax: ${person.taxShare.toFixed(2)} · Tip: ${person.tipShare.toFixed(2)}</span>
                    </div>
                  </div>
                  )
                })}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={copyToClipboard}
                className="bg-surface border border-border rounded-xl py-3.5 px-4 text-sm font-medium hover:bg-surface/80 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied Summary!' : 'Copy Summary'}
              </button>

              <button
                onClick={copyShareLink}
                className="bg-surface border border-border rounded-xl py-3.5 px-4 text-sm font-medium hover:bg-surface/80 transition-colors flex items-center justify-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                {copiedLink ? 'Link Copied!' : 'Copy Link'}
              </button>
              
              <button
                onClick={() => {
                  const url = getShareUrl()
                  if (navigator.share) {
                    navigator.share({
                      title: `${activeSplit.name} — Bill Split`,
                      text: getShareableText(),
                      url
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

            {/* Collapsible Share Text Preview */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <button
                onClick={() => setShowTextPreview(!showTextPreview)}
                className="w-full px-4 py-2.5 text-xs font-medium text-muted hover:text-primary flex items-center justify-between transition-colors"
              >
                <span>Preview shareable text & link</span>
                {showTextPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showTextPreview && (
                <pre className="p-4 pt-0 text-xs font-mono text-muted whitespace-pre-wrap break-all border-t border-border/50 bg-background/50">
                  {getShareableText()}
                </pre>
              )}
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
        <div
          onClick={() => {
            setEditingItem(null)
            setModalError(null)
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-black border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-muted">Advanced Split</span>
                <h4 className="font-bold text-base truncate">{editingItem.name}</h4>
              </div>
              <button 
                onClick={() => {
                  setEditingItem(null)
                  setModalError(null)
                }}
                aria-label="Close split editor"
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

              {modalError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Split Mode</label>
                  <button
                    onClick={() => {
                      setModalError(null)
                      setEditSplits(buildModeDefaults(editSplitMode, editingItem, 'none', {}))
                    }}
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    Split evenly
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1 border border-border bg-surface p-1 rounded-xl">
                  {['equal', 'shares', 'percentage', 'exact'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setModalError(null)
                        setEditSplits(buildModeDefaults(mode, editingItem, editSplitMode, editSplits))
                        setEditSplitMode(mode)
                      }}
                      className={`text-[10px] uppercase font-bold py-2 rounded-lg text-center transition-colors ${
                        editSplitMode === mode
                          ? 'bg-accent text-white shadow-sm'
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
                              const curr = parseInt(editSplits[person], 10) || 0
                              setEditSplits({ ...editSplits, [person]: Math.max(0, curr - 1) })
                            }}
                            aria-label={`Decrease shares for ${person}`}
                            className="px-2 py-1 hover:bg-surface text-sm border-r border-border font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editSplits[person]}
                            onChange={(e) => setEditSplits({ ...editSplits, [person]: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                            className="w-12 bg-transparent text-center text-sm font-mono outline-none"
                          />
                          <button
                            onClick={() => {
                              const curr = parseInt(editSplits[person], 10) || 0
                              setEditSplits({ ...editSplits, [person]: curr + 1 })
                            }}
                            aria-label={`Increase shares for ${person}`}
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
                  <span className={Math.abs(people.reduce((s, p) => s + (parseFloat(editSplits[p]) || 0), 0) - 100) <= 0.05 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {people.reduce((s, p) => s + (parseFloat(editSplits[p]) || 0), 0).toFixed(1)}% / 100%
                  </span>
                </div>
              )}
              {editSplitMode === 'exact' && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Allocated:</span>
                  <span className={people.reduce((s, p) => s + Math.round((parseFloat(editSplits[p]) || 0) * 100), 0) === Math.round(editingItem.price * 100) ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    ${(people.reduce((s, p) => s + Math.round((parseFloat(editSplits[p]) || 0) * 100), 0) / 100).toFixed(2)} / ${editingItem.price.toFixed(2)}
                  </span>
                </div>
              )}

            </div>

            <div className="border-t border-border p-4 bg-surface flex gap-3">
              <button
                onClick={() => {
                  setEditingItem(null)
                  setModalError(null)
                }}
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
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
                aria-label="Close sessions menu"
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
                const isConfirmingDelete = confirmDeleteSplitId === s.id

                return (
                  <div 
                    key={s.id}
                    className={`group rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                      isActive 
                        ? 'border-accent/40 bg-accent/5 dark:bg-accent/10 shadow-sm' 
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
                          aria-label="Save name"
                          className="p-1 text-green-500 hover:bg-background rounded-md transition-colors shrink-0"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setRenamingSplitId(null)}
                          aria-label="Cancel rename"
                          className="p-1 text-muted hover:bg-background rounded-md transition-colors shrink-0"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-red-500 font-medium truncate">
                          {splits.length <= 1 ? 'Clear & reset?' : `Delete "${s.name}"?`}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              deleteImageFromDB(`${s.id}_src`)
                              deleteImageFromDB(`${s.id}_cropped`)
                              setConfirmDeleteSplitId(null)
                              if (splits.length <= 1) {
                                const resetSplit = createNewSplitObject('My First Split')
                                setSplits([resetSplit])
                                setCurrentSplitId(resetSplit.id)
                                setIsSidebarOpen(false)
                                return
                              }
                              const remaining = splits.filter(item => item.id !== s.id)
                              setSplits(remaining)
                              if (isActive) {
                                setCurrentSplitId(remaining[0].id)
                              }
                            }}
                            className="px-2 py-1 rounded-md bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteSplitId(null)}
                            className="px-2 py-1 rounded-md border border-border hover:bg-background transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
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
                            aria-label={`Rename ${s.name}`}
                            className="p-1 text-muted hover:text-primary hover:bg-background rounded-md transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteSplitId(s.id)}
                            aria-label={`Delete ${s.name}`}
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
            {isCreatingSplit ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const newSplit = createNewSplitObject(newSplitName.trim())
                  setSplits(prev => [...prev, newSplit])
                  setCurrentSplitId(newSplit.id)
                  setNewSplitName('')
                  setIsCreatingSplit(false)
                  setIsSidebarOpen(false)
                }}
                className="space-y-2"
              >
                <input
                  type="text"
                  placeholder="Split name (optional)..."
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsCreatingSplit(false)}
                  className="w-full bg-surface border border-accent rounded-xl px-3 py-2 text-sm outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingSplit(false)
                      setNewSplitName('')
                    }}
                    className="flex-1 border border-border rounded-xl py-2 text-xs font-medium hover:bg-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-accent text-white rounded-xl py-2 text-xs font-semibold hover:bg-accent/90 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingSplit(true)}
                className="w-full bg-accent text-white hover:bg-accent/90 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Split</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {showReceiptPreviewModal && croppedImage && (
        <div
          onClick={() => setShowReceiptPreviewModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white dark:bg-black border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="border-b border-border p-4 flex items-center justify-between bg-surface">
              <h4 className="font-bold text-base">Receipt Reference</h4>
              <button 
                onClick={() => setShowReceiptPreviewModal(false)}
                aria-label="Close receipt preview"
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

export function roundCents(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100
}

/**
 * Distributes an integer quantity (e.g. cents or tenths of a percent) across
 * non-negative weights using the largest-remainder method so parts sum exactly
 * to totalUnits without assigning remainder units to zero-weight entries.
 */
export function distributeUnits(totalUnits, weights) {
  if (!Array.isArray(weights) || weights.length === 0) return []
  const safeTotal = Math.round(totalUnits)
  const cleanWeights = weights.map(w => Math.max(0, Number(w) || 0))
  const totalWeight = cleanWeights.reduce((sum, w) => sum + w, 0)
  if (totalWeight <= 0 || safeTotal === 0) {
    return cleanWeights.map(() => 0)
  }

  const exact = cleanWeights.map((weight, idx) => {
    const raw = (weight / totalWeight) * safeTotal
    const floored = safeTotal >= 0 ? Math.floor(raw) : Math.ceil(raw)
    return {
      idx,
      weight,
      floored,
      remainder: Math.abs(raw - floored)
    }
  })

  const remaining = safeTotal - exact.reduce((sum, e) => sum + e.floored, 0)
  const step = remaining >= 0 ? 1 : -1
  const positiveEntries = exact
    .filter(e => e.weight > 0)
    .sort((a, b) => b.remainder - a.remainder || a.idx - b.idx)

  const allocations = exact.map(e => e.floored)
  for (let i = 0; i < Math.abs(remaining) && positiveEntries.length > 0; i++) {
    allocations[positiveEntries[i % positiveEntries.length].idx] += step
  }
  return allocations
}

// Pure calculation helper for unit tests & component render
export function calculateResults({ people, items, taxInput, tipInput, tipIsPercentage }) {
  const individualCents = {}
  const individualItems = {}
  people.forEach(p => {
    individualCents[p] = 0
    individualItems[p] = []
  })

  items.forEach(item => {
    const price = Math.max(0, Number(item.price) || 0)
    const priceCents = Math.round(price * 100)
    const itemName = item.name || 'Unnamed Item'

    if (item.splitMode === 'equal') {
      const selectedIndices = []
      people.forEach((p, idx) => {
        if (item.splits?.[p] === true) selectedIndices.push(idx)
      })
      if (selectedIndices.length > 0) {
        const weights = people.map((_, idx) => (selectedIndices.includes(idx) ? 1 : 0))
        const sharesCents = distributeUnits(priceCents, weights)
        const splitDetail = selectedIndices.length > 1
          ? `$${price.toFixed(2)} ÷ ${selectedIndices.length}`
          : ''
        selectedIndices.forEach(idx => {
          const p = people[idx]
          const shareCents = sharesCents[idx]
          individualCents[p] += shareCents
          individualItems[p].push({
            id: item.id,
            name: itemName,
            itemPrice: price,
            shareAmount: shareCents / 100,
            splitMode: 'equal',
            splitDetail
          })
        })
      }
    } else if (item.splitMode === 'shares') {
      const weights = people.map(p => Math.max(0, Number(item.splits?.[p]) || 0))
      const totalShares = weights.reduce((sum, w) => sum + w, 0)
      if (totalShares > 0) {
        const sharesCents = distributeUnits(priceCents, weights)
        people.forEach((p, idx) => {
          const shares = weights[idx]
          if (shares > 0) {
            const shareCents = sharesCents[idx]
            individualCents[p] += shareCents
            individualItems[p].push({
              id: item.id,
              name: itemName,
              itemPrice: price,
              shareAmount: shareCents / 100,
              splitMode: 'shares',
              splitDetail: `${shares}/${totalShares} shares of $${price.toFixed(2)}`
            })
          }
        })
      }
    } else if (item.splitMode === 'percentage') {
      const pcts = people.map(p => Math.max(0, Number(item.splits?.[p]) || 0))
      const sumPct = pcts.reduce((sum, v) => sum + v, 0)
      const sharesCents = Math.abs(sumPct - 100) <= 0.1
        ? distributeUnits(priceCents, pcts)
        : pcts.map(pct => Math.round((pct / 100) * priceCents))

      people.forEach((p, idx) => {
        const pct = pcts[idx]
        if (pct > 0) {
          const shareCents = sharesCents[idx]
          individualCents[p] += shareCents
          individualItems[p].push({
            id: item.id,
            name: itemName,
            itemPrice: price,
            shareAmount: shareCents / 100,
            splitMode: 'percentage',
            splitDetail: `${pct}% of $${price.toFixed(2)}`
          })
        }
      })
    } else if (item.splitMode === 'exact') {
      people.forEach(p => {
        const amt = Math.max(0, Number(item.splits?.[p]) || 0)
        const shareCents = Math.round(amt * 100)
        if (shareCents > 0) {
          individualCents[p] += shareCents
          individualItems[p].push({
            id: item.id,
            name: itemName,
            itemPrice: price,
            shareAmount: shareCents / 100,
            splitMode: 'exact',
            splitDetail: `custom of $${price.toFixed(2)}`
          })
        }
      })
    }
  })

  const subtotalWeights = people.map(p => individualCents[p])
  const totalSubtotalCents = subtotalWeights.reduce((sum, c) => sum + c, 0)
  const totalSubtotal = totalSubtotalCents / 100

  const absoluteTaxCents = Math.round(Math.max(0, parseFloat(taxInput) || 0) * 100)
  const absoluteTax = absoluteTaxCents / 100

  const tipVal = Math.max(0, parseFloat(tipInput) || 0)
  const absoluteTipCents = tipIsPercentage
    ? Math.round(totalSubtotalCents * (tipVal / 100))
    : Math.round(tipVal * 100)
  const absoluteTip = absoluteTipCents / 100

  const taxAllocations = distributeUnits(absoluteTaxCents, subtotalWeights)
  const tipAllocations = distributeUnits(absoluteTipCents, subtotalWeights)

  const breakdown = people.map((person, idx) => {
    const subtotalCents = individualCents[person]
    const taxShareCents = taxAllocations[idx] || 0
    const tipShareCents = tipAllocations[idx] || 0
    const totalCents = subtotalCents + taxShareCents + tipShareCents

    return {
      name: person,
      subtotal: subtotalCents / 100,
      taxShare: taxShareCents / 100,
      tipShare: tipShareCents / 100,
      total: totalCents / 100,
      items: individualItems[person]
    }
  })

  const grandTotal = (totalSubtotalCents + absoluteTaxCents + absoluteTipCents) / 100

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
    return !people.some(p => item.splits?.[p] === true)
  } else if (item.splitMode === 'shares') {
    return !people.some(p => (item.splits?.[p] || 0) > 0)
  } else if (item.splitMode === 'percentage') {
    return !people.some(p => (item.splits?.[p] || 0) > 0)
  } else if (item.splitMode === 'exact') {
    return !people.some(p => (item.splits?.[p] || 0) > 0)
  }
  return true
}

// Returns a short validation label if an item is unassigned or its custom split is out of sync
export function getItemValidationError(item, people) {
  if (isItemUnassignedPure(item, people)) {
    return 'Unassigned'
  }
  if (item.splitMode === 'percentage') {
    const sum = people.reduce((acc, p) => acc + Math.max(0, Number(item.splits?.[p]) || 0), 0)
    if (Math.abs(sum - 100) > 0.05) {
      return `Splits ${sum.toFixed(1)}% ≠ 100%`
    }
  } else if (item.splitMode === 'exact') {
    const sumCents = people.reduce((acc, p) => acc + Math.round(Math.max(0, Number(item.splits?.[p]) || 0) * 100), 0)
    const priceCents = Math.round(Math.max(0, Number(item.price) || 0) * 100)
    if (sumCents !== priceCents) {
      return `Splits ≠ $${(priceCents / 100).toFixed(2)}`
    }
  }
  return null
}

function bytesToBase64Url(bytes) {
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function encodeSharePayload(split) {
  const payload = {
    v: 1,
    n: String(split?.name || 'Shared Split'),
    p: Array.isArray(split?.people) ? split.people.map(String) : [],
    i: Array.isArray(split?.items) ? split.items.map(item => ({
      n: String(item.name || 'Item'),
      p: roundCents(Math.max(0, Number(item.price) || 0)),
      m: item.splitMode || 'equal',
      s: item.splits && typeof item.splits === 'object' ? item.splits : {}
    })) : [],
    tx: String(split?.taxInput ?? '0.00'),
    tp: String(split?.tipInput ?? '0'),
    pct: Boolean(split?.tipIsPercentage)
  }
  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload))
  return bytesToBase64Url(jsonBytes)
}

export function decodeSharePayload(encoded) {
  if (!encoded || typeof encoded !== 'string') return null
  try {
    const bytes = base64UrlToBytes(encoded.trim())
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.p) || !Array.isArray(parsed.i)) {
      return null
    }
    const validModes = new Set(['equal', 'shares', 'percentage', 'exact'])
    const people = parsed.p.filter(p => typeof p === 'string' && p.trim().length > 0)
    const items = parsed.i.map(rawItem => {
      const splitMode = validModes.has(rawItem?.m) ? rawItem.m : 'equal'
      const splits = {}
      if (rawItem?.s && typeof rawItem.s === 'object') {
        people.forEach(person => {
          if (Object.prototype.hasOwnProperty.call(rawItem.s, person)) {
            const val = rawItem.s[person]
            splits[person] = splitMode === 'equal' ? Boolean(val) : (Number(val) || 0)
          }
        })
      }
      return {
        id: Math.random().toString(36).substring(2, 9),
        name: typeof rawItem?.n === 'string' && rawItem.n.trim() ? rawItem.n : 'Item',
        price: roundCents(Math.max(0, Number(rawItem?.p) || 0)),
        splitMode,
        splits
      }
    })

    return {
      id: Math.random().toString(36).substring(2, 9),
      name: typeof parsed.n === 'string' && parsed.n.trim() ? parsed.n.trim() : 'Shared Split',
      people,
      items,
      taxInput: String(parsed.tx ?? '0.00'),
      tipInput: String(parsed.tp ?? '0'),
      tipIsPercentage: parsed.pct !== false,
      step: 'results',
      imageSrc: null,
      croppedImage: null
    }
  } catch {
    return null
  }
}

export function getShareParamFromLocation(loc) {
  if (!loc) return null
  try {
    if (loc.search) {
      const token = new URLSearchParams(loc.search).get('s')
      if (token) return token
    }
    if (loc.hash && loc.hash.startsWith('#s=')) {
      return loc.hash.slice(3)
    }
  } catch {
    return null
  }
  return null
}

export function buildShareUrl(split, baseUrl) {
  const token = encodeSharePayload(split)
  if (!baseUrl) return `?s=${token}`
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}s=${token}`
}

export function formatShareableText({ splitName, results, tipInput, tipIsPercentage, shareUrl }) {
  const title = splitName || 'Bill Split Breakdown'
  const tipLabel = tipIsPercentage ? `${tipInput || 0}%` : 'flat rate'
  const lines = [
    `🧾 ${title}`,
    `Subtotal: $${results.totalSubtotal.toFixed(2)} | Tax: $${results.absoluteTax.toFixed(2)} | Tip: $${results.absoluteTip.toFixed(2)} (${tipLabel})`,
    `Grand Total: $${results.grandTotal.toFixed(2)}`,
    `---------------------------`
  ]

  results.breakdown.forEach(person => {
    lines.push(`• ${person.name} — $${person.total.toFixed(2)}`)
    if (person.items && person.items.length > 0) {
      person.items.forEach(item => {
        const detailSuffix = item.splitDetail ? ` (${item.splitDetail})` : ''
        lines.push(`  - ${item.name}: $${item.shareAmount.toFixed(2)}${detailSuffix}`)
      })
    } else {
      lines.push(`  - No items assigned`)
    }
    lines.push(`  Sub: $${person.subtotal.toFixed(2)} | Tax: $${person.taxShare.toFixed(2)} | Tip: $${person.tipShare.toFixed(2)}`)
  })

  if (shareUrl) {
    lines.push(`---------------------------`)
    lines.push(`View breakdown: ${shareUrl}`)
  }

  return lines.join('\n')
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
