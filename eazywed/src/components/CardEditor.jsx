"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/card-editor.css"
import createAPI from "../utils/api"

// Declare fabric as a global variable
let fabric

const CardEditor = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [cardData, setCardData] = useState({ city: "" })
  const [currentTool, setCurrentTool] = useState("select")
  const [selectedObject, setSelectedObject] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewImage, setPreviewImage] = useState("")
  const [initialSettings, setInitialSettings] = useState(null)

  const [isEditMode, setIsEditMode] = useState(false)
  const [cardId, setCardId] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showAssetsPanel, setShowAssetsPanel] = useState(false)
  const [assets, setAssets] = useState([])
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true)
  const [bgImageFit, setBgImageFit] = useState("cover") // 'cover' or 'contain'
  const [bgImageScale, setBgImageScale] = useState(100) // percentage

  // Add a list of web-safe fonts that will be available
  const availableFonts = [
    "Poppins",
    "Dancing Script",
    "Great Vibes",
    "Pacifico",
    "Montserrat",
    "Roboto",
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
  ]

  // Array to track loaded fonts
  const [loadedFonts, setLoadedFonts] = useState(availableFonts.slice(0, 6)) // Default fonts considered loaded

  // Property states
  const [textProps, setTextProps] = useState({
    fontFamily: "Poppins",
    fontSize: 24,
    fill: "#000000",
    textAlign: "left",
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    lineHeight: 1.2,
    charSpacing: 0,
  })

  const [shapeProps, setShapeProps] = useState({
    type: "rect",
    fill: "#d7385e",
    stroke: "#000000",
    strokeWidth: 1,
    opacity: 1,
    transparentFill: false,
  })

  const [imageProps, setImageProps] = useState({
    opacity: 1,
    filter: "none",
    filterValue: 0.5,
    stroke: "#000000",
    strokeWidth: 0,
  })

  const [canvasProps, setCanvasProps] = useState({
    width: 800,
    height: 600,
    backgroundColor: "#ffffff",
  })

  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const editableFieldsRef = useRef([])
  const bgImageInputRef = useRef(null)
  const assetInputRef = useRef(null)
  const customFontInputRef = useRef(null)

  // Track loaded state separately
  const [fabricLoaded, setFabricLoaded] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [initAttempted, setInitAttempted] = useState(false)
  
  // Use the centralized API instance
  const api = createAPI(navigate)

  // Add keyboard event listener for deleting objects
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if canvas not initialized
      if (!fabricCanvasRef.current) return;
      
      // Get active object
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (!activeObject) return;
      
      // Skip if currently editing text
      if (activeObject.type === "i-text" && activeObject.isEditing) return;
      
      // Delete key pressed (Delete or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleRemoveObject();
        e.preventDefault();
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);  // Empty dependency array means this only runs once on mount

  // Load Fabric.js library
  useEffect(() => {
    const loadFabricJS = async () => {
      console.log("Loading Fabric.js...")
      if (typeof window.fabric === "undefined") {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"
            script.async = true
            script.onload = () => {
              console.log("Fabric.js loaded successfully")
              fabric = window.fabric
              setFabricLoaded(true)
              resolve()
            }
            script.onerror = () => {
              console.error("Failed to load Fabric.js")
              reject(new Error("Failed to load Fabric.js"))
            }
            document.head.appendChild(script)
          })
          
          // Preload fonts
          preloadFonts(availableFonts.slice(0, 6))
        } catch (error) {
          console.error("Error during Fabric.js loading:", error)
          toast.error("Failed to load editor library")
        }
      } else {
        console.log("Fabric.js already loaded")
        fabric = window.fabric
        setFabricLoaded(true)
        preloadFonts(availableFonts.slice(0, 6))
      }
    }

    loadFabricJS()
  }, []) // Empty dependency array to run only once

  // Extract and process data from location or URL
  useEffect(() => {
    console.log("Processing location and URL data...")
    
    try {
    // Check for card data in location state
    if (location.state) {
      console.log("Location state received:", location.state)
      
      // If we have cardId in state, this is an edit operation
      if (location.state.cardId) {
        setIsEditMode(true)
        setCardId(location.state.cardId)
      }
      
      // If we have form data, use it
      if (location.state.formData) {
        setCardData(location.state.formData)
      }
      
      // If we have card settings, store them for canvas initialization
      if (location.state.cardSettings) {
          console.log("Found card settings in location state")
          
          // Process settings if needed
          let processedSettings = location.state.cardSettings
          if (typeof processedSettings === 'string') {
            try {
              processedSettings = JSON.parse(processedSettings)
              console.log("Parsed settings string successfully")
            } catch (error) {
              console.error("Error parsing settings from location:", error)
            }
          }
          
          setInitialSettings(processedSettings)
          setSettingsLoaded(true)
      }
    } else {
      // Check URL for cardId as fallback
      const urlParams = new URLSearchParams(location.search)
      const cardIdFromUrl = urlParams.get("cardId")
      
      if (cardIdFromUrl) {
        console.log("Card ID found in URL:", cardIdFromUrl)
        setIsEditMode(true)
        setCardId(cardIdFromUrl)
      } else {
        // No data provided at all - redirect back to form
        console.error("No card data or ID provided")
        toast.error("No card data found. Please start from the form.")
        navigate("/vendor/wedding-card-form")
        }
      }
    } catch (error) {
      console.error("Error processing location data:", error)
      toast.error("Error processing card data")
    }
  }, [location, navigate])

  // Handle canvas initialization once both fabric.js is loaded and settings are available
  useEffect(() => {
    // Only proceed if canvas and location data processing is complete
    if (!fabricLoaded || initAttempted) return
    
    const initializeEditor = async () => {
      console.log("Beginning editor initialization...")
      setInitAttempted(true)
      
      try {
        if (isEditMode && cardId && !settingsLoaded) {
          // If editing and we don't have settings already, fetch from API
          console.log("Loading existing card data from API:", cardId)
          await loadExistingCard(cardId)
        } else if (settingsLoaded && initialSettings) {
          // If we already have settings, use them directly
          console.log("Using already loaded settings for initialization")
          setupCanvas(initialSettings)
      } else {
          // Create a new canvas with default settings
          console.log("Creating new canvas with default settings")
          setupCanvas()
        }
      } catch (error) {
        console.error("Error during editor initialization:", error)
        toast.error("Failed to initialize editor")
        setIsLoading(false)
      }
    }
    
    initializeEditor()
  }, [fabricLoaded, isEditMode, cardId, settingsLoaded, initAttempted, initialSettings])

  // Function to preload fonts for better font rendering
  const preloadFonts = (fontList) => {
    fontList.forEach((fontName) => {
      // Only load if not already loaded
      if (!document.fonts.check(`12px "${fontName}"`)) {
        const link = document.createElement("link")
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(" ", "+")}&display=swap`
        link.rel = "stylesheet"
        document.head.appendChild(link)

        // For web fonts API
        document.fonts.ready.then(() => {
          console.log(`Font ${fontName} loaded successfully`)
        })
      }
    })
  }

  const initializeCanvas = () => {
    console.log("Initializing canvas...")
    // Check if we have an ID and need to load existing card data
    if (isEditMode && cardId && !initialSettings) {
      // If editing and we don't have settings already, fetch from API
      console.log("Editing mode with ID but no settings, fetching from API:", cardId)
          loadExistingCard(cardId)
    } else if (initialSettings) {
      // If we already have settings from location state, use them directly
      console.log("Using settings from location state for initialization")
      setupCanvas(initialSettings)
      } else {
      // Create a new canvas with default settings
      console.log("Creating new canvas with default settings")
        setupCanvas()
    }
  }

  // Setup canvas with existing settings if provided
  const setupCanvas = (existingSettings = null) => {
    console.log("Setting up canvas...", existingSettings ? "with settings" : "with defaults")
    
    if (!canvasRef.current) {
      console.error("Canvas reference is null, aborting setup")
      toast.error("Canvas reference not found. Please refresh the page.")
      setIsLoading(false)
      return
    }
    
    if (!fabric) {
      console.error("Fabric.js not loaded yet, aborting setup")
      toast.error("Editor library not loaded yet. Please wait or refresh.")
      setIsLoading(false)
      return
    }

    try {
      // Clear any existing canvas
        if (fabricCanvasRef.current) {
        console.log("Disposing existing canvas instance")
          fabricCanvasRef.current.dispose()
        }

      // Parse dimensions and properties from settings
      let width = 800
      let height = 600
      let backgroundColor = "#ffffff"
      let canvasJSON = null
      
        if (existingSettings) {
        console.log("Processing existing settings for canvas setup")
        
        // Handle dimensions
        width = parseInt(existingSettings.width) || width
        height = parseInt(existingSettings.height) || height
        console.log(`Canvas dimensions: ${width}x${height}`)
        
        // Handle background color
        if (existingSettings.canvasJSON) {
          if (existingSettings.canvasJSON.backgroundColor) {
            backgroundColor = existingSettings.canvasJSON.backgroundColor
          } else if (existingSettings.canvasJSON.background) {
            backgroundColor = existingSettings.canvasJSON.background
          }
          canvasJSON = existingSettings.canvasJSON
        }
        
        // Set background image fit/scale if available
          if (existingSettings.bgImageFit) {
          console.log("Setting background image fit:", existingSettings.bgImageFit)
            setBgImageFit(existingSettings.bgImageFit)
          }
          
          if (existingSettings.bgImageScale) {
          console.log("Setting background image scale:", existingSettings.bgImageScale)
            setBgImageScale(existingSettings.bgImageScale)
          }
        
        // Store editable fields reference if available
        if (existingSettings.editableFields) {
          console.log("Loaded editable fields:", existingSettings.editableFields.length)
          editableFieldsRef.current = existingSettings.editableFields
        }
      }

      // Update canvas props in state
      setCanvasProps({
          width: width,
          height: height,
        backgroundColor: backgroundColor,
      })

      console.log(`Creating new Fabric.js canvas (${width}x${height})`)
      
      // Create new fabric canvas with proper dimensions
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: width,
        height: height,
        backgroundColor: backgroundColor,
          preserveObjectStacking: true,
          selection: true,
          renderOnAddRemove: true,
        stopContextMenu: true // Prevent context menu on right-click
        })

      // Add selection event listeners
        fabricCanvasRef.current.on("selection:created", handleSelectionCreated)
        fabricCanvasRef.current.on("selection:updated", handleSelectionUpdated)
        fabricCanvasRef.current.on("selection:cleared", handleSelectionCleared)
      
      // Load data if available - this is the critical part for editing
      if (canvasJSON) {
        console.log("Attempting to load canvas from JSON")
        
        try {
          // Ensure canvasJSON is an object
          const canvasData = typeof canvasJSON === 'string' 
            ? JSON.parse(canvasJSON) 
            : canvasJSON
          
          // Load the canvas from JSON with proper callbacks
          fabricCanvasRef.current.loadFromJSON(
            canvasData, 
            () => {
              console.log("Canvas loaded from JSON successfully")
              
              // Force object property checks after loading
              const canvasObjects = fabricCanvasRef.current.getObjects()
              console.log(`Restored ${canvasObjects.length} objects`)
              
              canvasObjects.forEach(obj => {
                // Re-establish object properties
                if (obj.customType === "editableField" || obj.fieldId) {
                  console.log(`Re-establishing properties for object type ${obj.type} with ID ${obj.fieldId || "unknown"}`)
                  obj.set({
                    editable: true,
                    lockMovementX: false, // Allow movement initially
                    lockMovementY: false,
                  })
                }
                
                // Ensure text objects have proper font loading
                if (obj.type === 'i-text' || obj.type === 'textbox') {
                  if (obj.fontFamily && !loadedFonts.includes(obj.fontFamily)) {
                    console.log(`Loading font for text object: ${obj.fontFamily}`)
                    preloadFonts([obj.fontFamily])
                    setLoadedFonts(prev => [...prev, obj.fontFamily])
                  }
                }
              })
              
              fabricCanvasRef.current.renderAll()
              setIsLoading(false)
            }, 
            (o, object) => {
              // This is a callback for each object loaded
              console.log(`Loaded object: ${object.type}${object.text ? ` with text "${object.text.substring(0, 15)}${object.text.length > 15 ? '...' : ''}"` : ''}`)
            }
          )
        } catch (error) {
          console.error("Error loading canvas JSON:", error)
          toast.error("Error restoring canvas. Creating a new canvas instead.")
          fabricCanvasRef.current.clear()
          fabricCanvasRef.current.setBackgroundColor(backgroundColor, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current))
            setIsLoading(false)
          }
        } else {
        console.log("No canvas JSON to load, using empty canvas")
          setIsLoading(false)
        }

      // Apply initial zoom to fit canvas to window
      fitCanvasToWindow()
      
      console.log("Canvas initialization complete")
      } catch (error) {
        console.error("Error setting up canvas:", error)
      toast.error("Failed to initialize editor: " + error.message)
        setIsLoading(false)
      }
  }

  // Helper function to fit canvas to window
  const fitCanvasToWindow = () => {
    if (!fabricCanvasRef.current) return
    
    // Get the container dimensions
    const container = document.querySelector('.canvas-container')
    if (!container) return
    
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // Calculate optimal zoom level
    const canvasWidth = fabricCanvasRef.current.getWidth()
    const canvasHeight = fabricCanvasRef.current.getHeight()
    
    // Calculate zoom to fit either width or height, whichever is smaller
    const widthRatio = (containerWidth - 60) / canvasWidth
    const heightRatio = (containerHeight - 60) / canvasHeight
    
    // Choose the smaller ratio to ensure the canvas fits
    const newZoom = Math.min(widthRatio, heightRatio, 1) // Never zoom above 100%
    
    // Set zoom level
    setZoomLevel(newZoom)
  }

  // Function to load an existing card template
  const loadExistingCard = async (id) => {
    if (!id) {
      console.error("No card ID provided to loadExistingCard")
      toast.error("Missing card ID")
      return
    }

      setIsLoading(true)
      console.log(`Loading card template with ID: ${id}`)

    try {
      const response = await api.get(`/vendor/dashboard/cards/${id}`)
      const card = response.data

      console.log("Card data loaded:", {
        id: card._id,
        type: card.type,
        hasSettings: !!card.settings
      })

      // Store the card data
      setCardData({
        type: card.type,
        price_per_card: card.price_per_card,
        quantity_available: card.quantity_available, 
        city: card.city || "", // Added city field
        format: Array.isArray(card.format) ? card.format : [card.format],
        design_time: card.design_time,
        description: card.description || ""
      })

      // Check if it's editable type
      if (card.type !== "editable") {
        console.error("Card is not of editable type:", card.type)
        toast.error("This card is not editable")
        setTimeout(() => navigate("/vendor/dashboard"), 2000)
        return
      }

      // Check if it has settings
      if (!card.settings) {
        console.error("Card has no settings")
        toast.error("This card has no editor settings - cannot edit")
        setTimeout(() => navigate("/vendor/dashboard"), 2000)
        return
      }
      
      // Process settings data from the API response
      let settingsData = card.settings
      console.log("Original settings data type:", typeof settingsData)
      
      try {
        // Parse settings if they're stored as a string
      if (typeof settingsData === 'string') {
        try {
            console.log("Settings is a string, attempting to parse...")
            const trimmedSettings = settingsData.trim()
            if (trimmedSettings) {
              settingsData = JSON.parse(trimmedSettings)
              console.log("Successfully parsed settings JSON string to object")
            } else {
              throw new Error("Settings string is empty")
            }
        } catch (parseError) {
            console.error("Failed to parse settings string:", parseError)
            throw new Error(`Invalid settings format: ${parseError.message}`)
          }
        }
        
        // Ensure canvasJSON is properly parsed if it's a string
        if (settingsData && typeof settingsData.canvasJSON === 'string') {
          try {
            console.log("canvasJSON is a string, attempting to parse...")
            const trimmedCanvasJSON = settingsData.canvasJSON.trim()
            if (trimmedCanvasJSON) {
              settingsData.canvasJSON = JSON.parse(trimmedCanvasJSON)
              console.log("Successfully parsed nested canvasJSON")
            } else {
              throw new Error("canvasJSON string is empty")
            }
          } catch (parseError) {
            console.error("Failed to parse canvasJSON:", parseError)
            throw new Error(`Invalid canvasJSON format: ${parseError.message}`)
          }
        }
        
        // Validate required settings properties
        if (!settingsData.width || !settingsData.height) {
          console.warn("Settings missing width/height, using defaults")
          settingsData.width = settingsData.width || 800
          settingsData.height = settingsData.height || 600
        }
        
        // Ensure canvasJSON exists
        if (!settingsData.canvasJSON) {
          console.warn("Settings missing canvasJSON, creating empty object")
          settingsData.canvasJSON = { objects: [] }
        }
        
        console.log("Settings prepared for canvas initialization")
        console.log("Canvas dimensions:", settingsData.width, "x", settingsData.height)
        console.log("Has background:", !!settingsData.canvasJSON.backgroundColor)
        console.log("Objects count:", Array.isArray(settingsData.canvasJSON.objects) ? 
                     settingsData.canvasJSON.objects.length : 'unknown')
        
        // Initialize canvas with processed settings
        setInitialSettings(settingsData)
        setSettingsLoaded(true)
      setupCanvas(settingsData)
      } catch (error) {
        console.error("Error processing card settings:", error)
        toast.error(`Failed to process card settings: ${error.message}`)
        setTimeout(() => navigate("/vendor/dashboard"), 2000)
      }
    } catch (error) {
      console.error("Error loading card:", error)
      toast.error(`Failed to load card: ${error.response?.data?.message || error.message}`)
      setTimeout(() => navigate("/vendor/dashboard"), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle selection events
  const handleSelectionCreated = (e) => {
    const activeObject = e.selected[0]
    setSelectedObject(activeObject)
    updatePropertiesPanel(activeObject)
  }

  const handleSelectionUpdated = (e) => {
    const activeObject = e.selected[0]
    setSelectedObject(activeObject)
    updatePropertiesPanel(activeObject)
  }

  const handleSelectionCleared = () => {
    setSelectedObject(null)
  }

  const updatePropertiesPanel = (activeObject) => {
    if (!activeObject) return

    if (activeObject.type === "i-text" || activeObject.type === "textbox") {
      setCurrentTool("text")
      setTextProps({
        fontFamily: activeObject.fontFamily || "Poppins",
        fontSize: activeObject.fontSize || 24,
        fill: activeObject.fill || "#000000",
        textAlign: activeObject.textAlign || "left",
        fontWeight: activeObject.fontWeight || "normal",
        fontStyle: activeObject.fontStyle || "normal",
        underline: activeObject.underline || false,
        lineHeight: activeObject.lineHeight || 1.2,
        charSpacing: activeObject.charSpacing || 0,
      })
    } else if (activeObject.type === "image") {
      setCurrentTool("image")
      setImageProps({
        opacity: activeObject.opacity || 1,
        filter: "none",
        filterValue: 0.5,
        stroke: activeObject.stroke || "#000000",
        strokeWidth: 0,
      })
    } else {
      // For shapes
      setCurrentTool("shape")
      setShapeProps({
        type: activeObject._shape || "rect",
        fill: activeObject.fill || "#d7385e",
        stroke: activeObject.stroke || "#000000",
        strokeWidth: activeObject.strokeWidth || 1,
        opacity: activeObject.opacity || 1,
      })
    }
  }

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomLevel < 3) {
      setZoomLevel((prev) => prev + 0.1)
    }
  }

  const handleZoomOut = () => {
    if (zoomLevel > 0.2) {
      setZoomLevel((prev) => prev - 0.1)
    }
  }

  const handleZoomReset = () => {
    setZoomLevel(1)
  }

  // Tool handlers
  const handleAddText = () => {
    if (!fabricCanvasRef.current) {
      toast.error("Canvas not ready")
      return
    }

    // Ensure font is loaded before adding text
    if (!loadedFonts.includes(textProps.fontFamily)) {
      preloadFonts([textProps.fontFamily])
      setLoadedFonts((prev) => [...prev, textProps.fontFamily])
    }

    const text = new window.fabric.IText("Double click to edit", {
      left: fabricCanvasRef.current.width / 2,
      top: fabricCanvasRef.current.height / 2,
      fontFamily: textProps.fontFamily,
      fontSize: textProps.fontSize,
      fill: textProps.fill,
      textAlign: textProps.textAlign,
      fontWeight: textProps.fontWeight,
      fontStyle: textProps.fontStyle,
      underline: textProps.underline,
      lineHeight: textProps.lineHeight,
      charSpacing: textProps.charSpacing,
      originX: "center",
      originY: "center",
      editable: true,
    })

    // Add to editable fields
    const fieldId = `text_${Date.now()}`
    text.set("fieldId", fieldId)
    editableFieldsRef.current.push({
      id: fieldId,
      type: "text",
      defaultText: "Double click to edit",
    })

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
    setCurrentTool("text")
  }

  const handleAddShape = () => {
    if (!fabricCanvasRef.current) {
      toast.error("Canvas not ready")
      return
    }

    let shape
    const commonProps = {
      left: fabricCanvasRef.current.width / 2,
      top: fabricCanvasRef.current.height / 2,
      fill: shapeProps.transparentFill ? "rgba(0,0,0,0)" : shapeProps.fill,
      stroke: shapeProps.stroke,
      strokeWidth: shapeProps.strokeWidth,
      opacity: shapeProps.opacity,
      originX: "center",
      originY: "center",
    }

    switch (shapeProps.type) {
      case "rect":
        shape = new window.fabric.Rect({
          ...commonProps,
          width: 100,
          height: 100,
          rx: 0,
          ry: 0,
        })
        shape.set("_shape", "rect")
        break
      case "circle":
        shape = new window.fabric.Circle({
          ...commonProps,
          radius: 50,
        })
        shape.set("_shape", "circle")
        break
      case "triangle":
        shape = new window.fabric.Triangle({
          ...commonProps,
          width: 100,
          height: 100,
        })
        shape.set("_shape", "triangle")
        break
      case "line":
        shape = new window.fabric.Line([50, 50, 200, 50], {
          left: fabricCanvasRef.current.width / 2 - 75,
          top: fabricCanvasRef.current.height / 2,
          stroke: shapeProps.stroke,
          strokeWidth: shapeProps.strokeWidth,
          opacity: shapeProps.opacity,
        })
        shape.set("_shape", "line")
        break
      case "polygon":
        shape = new window.fabric.Polygon(
          [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 75, y: 50 },
            { x: 50, y: 100 },
            { x: 0, y: 100 },
            { x: -25, y: 50 },
          ],
          {
            ...commonProps,
          },
        )
        shape.set("_shape", "polygon")
        break
      case "star":
        const points = 5
        const outerRadius = 50
        const innerRadius = 25
        const starPoints = []

        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (i * Math.PI) / points
          starPoints.push({
            x: radius * Math.sin(angle),
            y: radius * Math.cos(angle),
          })
        }

        shape = new window.fabric.Polygon(starPoints, {
          ...commonProps,
        })
        shape.set("_shape", "star")
        break
      case "heart":
        const heartPath = "M 0 -28 C -28 -28 -28 28 0 56 C 28 28 28 -28 0 -28 Z"
        shape = new window.fabric.Path(heartPath, {
          ...commonProps,
          scaleX: 1,
          scaleY: 1,
        })
        shape.set("_shape", "heart")
        break
      default:
        shape = new window.fabric.Rect({
          ...commonProps,
          width: 100,
          height: 100,
        })
        shape.set("_shape", "rect")
    }

    if (shape) {
      fabricCanvasRef.current.add(shape)
      fabricCanvasRef.current.setActiveObject(shape)
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleSetBackgroundImage = (e) => {
    if (!fabricCanvasRef.current) {
      toast.error("Canvas not ready")
      return
    }

    if (!e.target.files || !e.target.files[0]) {
      return
    }

    const file = e.target.files[0]

    // Check file size and type
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed")
      return
    }

    // Show loading toast
    const loadingToast = toast.loading("Setting background image...")

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Set background image that fully covers the canvas
        const imgWidth = img.width
        const imgHeight = img.height
        const canvasWidth = fabricCanvasRef.current.width
        const canvasHeight = fabricCanvasRef.current.height

        // Create pattern using the image as a background that covers the entire canvas
        fabric.Image.fromURL(
          event.target.result,
          (imgInstance) => {
            // Calculate scale based on fit mode
            let scale
            if (bgImageFit === "cover") {
              // Cover: ensure the image covers the entire canvas
              scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight) * (bgImageScale / 100)
            } else {
              // Contain: ensure the entire image is visible
              scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight) * (bgImageScale / 100)
            }

            // Set image properties
            imgInstance.set({
              originX: "center",
              originY: "center",
              scaleX: scale,
              scaleY: scale,
              // Center the image on the canvas
              left: canvasWidth / 2,
              top: canvasHeight / 2,
              // Make sure it doesn't interfere with other objects
              selectable: false,
              evented: false,
              crossOrigin: "anonymous",
            })

            // Set as background image
            fabricCanvasRef.current.setBackgroundImage(
              imgInstance,
              fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current),
            )

            // Force a re-render of the canvas
            fabricCanvasRef.current.renderAll()

            // Clear the file input
            if (bgImageInputRef.current) {
              bgImageInputRef.current.value = ""
            }

            // Update toast
            toast.update(loadingToast, {
              render: "Background image set successfully!",
              type: "success",
              isLoading: false,
              autoClose: 2000,
            })
          },
          { crossOrigin: "anonymous" },
        )
      }

      img.onerror = () => {
        toast.update(loadingToast, {
          render: "Failed to load background image",
          type: "error",
          isLoading: false,
          autoClose: 2000,
        })
      }

      img.src = event.target.result
    }

    reader.onerror = () => {
      toast.update(loadingToast, {
        render: "Failed to read image file",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      })
    }

    reader.readAsDataURL(file)
  }

  // Handle asset upload
  const handleAssetUpload = (e) => {
    if (!e.target.files || !e.target.files.length === 0) return

    Array.from(e.target.files).forEach((file) => {
      // Check file size and type
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image ${file.name} is too large (max 5MB)`)
        return
      }

      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        toast.error(`File ${file.name} is not a supported image type`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        // Create a new asset
        const newAsset = {
          id: `asset_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          src: event.target.result,
          name: file.name,
        }

        // Add to assets
        setAssets((prev) => [...prev, newAsset])
      }

      reader.onerror = () => {
        toast.error(`Failed to read file ${file.name}`)
      }

      reader.readAsDataURL(file)
    })

    // Clear the file input
    if (assetInputRef.current) {
      assetInputRef.current.value = ""
    }
  }

  // Use asset
  const handleUseAsset = (asset) => {
    if (!fabricCanvasRef.current) {
      toast.error("Canvas not ready")
      return
    }

    fabric.Image.fromURL(asset.src, (img) => {
      const scale = Math.min(
        (fabricCanvasRef.current.width * 0.5) / img.width,
        (fabricCanvasRef.current.height * 0.5) / img.height,
      )
      img.scale(scale)
      img.set({
        left: fabricCanvasRef.current.width / 2,
        top: fabricCanvasRef.current.height / 2,
        originX: "center",
        originY: "center",
      })
      fabricCanvasRef.current.add(img)
      fabricCanvasRef.current.setActiveObject(img)
      fabricCanvasRef.current.renderAll()
      setCurrentTool("image")
      setShowAssetsPanel(false)
    })
  }

  // Remove asset
  const handleRemoveAsset = (assetId) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== assetId))
  }

  // Add custom font
  const handleAddCustomFont = () => {
    if (customFontInputRef.current) {
      customFontInputRef.current.click()
    }
  }

  const handleCustomFontUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fontName = file.name.split(".")[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        // Create a new font face
        const fontFace = new FontFace(fontName, event.target.result)
        fontFace.load().then((loadedFace) => {
          // Add font to document
          document.fonts.add(loadedFace)

          // Update loadedFonts array
          setLoadedFonts((prev) => [...prev, fontName])

          // Update fontFamily options
          setTextProps((prev) => ({
            ...prev,
            fontFamily: fontName,
          }))

          // Apply to selected text
          const activeObject = fabricCanvasRef.current?.getActiveObject()
          if (activeObject && (activeObject.type === "i-text" || activeObject.type === "textbox")) {
            activeObject.set("fontFamily", fontName)
            fabricCanvasRef.current.renderAll()
          }

          toast.success(`Font "${fontName}" added successfully`)
        })
      } catch (error) {
        console.error("Error loading font:", error)
        toast.error("Failed to load custom font")
      }
    }

    reader.onerror = () => {
      toast.error("Failed to read font file")
    }

    reader.readAsArrayBuffer(file)
  }

  // Property change handlers
  const handleTextPropChange = (prop, value) => {
    setTextProps({ ...textProps, [prop]: value })

    const activeObject = fabricCanvasRef.current?.getActiveObject()
    if (activeObject && (activeObject.type === "i-text" || activeObject.type === "textbox")) {
      // If changing font family, preload it if not loaded
      if (prop === "fontFamily" && !loadedFonts.includes(value)) {
        preloadFonts([value])
        setLoadedFonts((prev) => [...prev, value])
      }

      activeObject.set(prop, value)
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleShapePropChange = (prop, value) => {
    setShapeProps({ ...shapeProps, [prop]: value })

    const activeObject = fabricCanvasRef.current?.getActiveObject()
    if (
      activeObject &&
      activeObject.type !== "i-text" &&
      activeObject.type !== "textbox" &&
      activeObject.type !== "image"
    ) {
      if (prop === "transparentFill") {
        activeObject.set("fill", value ? "rgba(0,0,0,0)" : shapeProps.fill)
      } else {
        activeObject.set(prop, value)
      }
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleImagePropChange = (prop, value) => {
    setImageProps({ ...imageProps, [prop]: value })

    const activeObject = fabricCanvasRef.current?.getActiveObject()
    if (activeObject && activeObject.type === "image") {
      if (prop === "filter") {
        activeObject.filters = []

        if (value !== "none") {
          switch (value) {
            case "grayscale":
              activeObject.filters.push(new window.fabric.Image.filters.Grayscale())
              break
            case "sepia":
              activeObject.filters.push(new window.fabric.Image.filters.Sepia())
              break
            case "invert":
              activeObject.filters.push(new window.fabric.Image.filters.Invert())
              break
            case "blur":
              activeObject.filters.push(new window.fabric.Image.filters.Blur({ blur: imageProps.filterValue * 0.5 }))
              break
            case "brightness":
              activeObject.filters.push(
                new window.fabric.Image.filters.Brightness({ brightness: imageProps.filterValue * 2 - 1 }),
              )
              break
            default:
              break
          }
          activeObject.applyFilters()
        }
      } else if (prop === "filterValue") {
        if (imageProps.filter !== "none") {
          activeObject.filters = []
          switch (imageProps.filter) {
            case "blur":
              activeObject.filters.push(new window.fabric.Image.filters.Blur({ blur: value * 0.5 }))
              break
            case "brightness":
              activeObject.filters.push(new window.fabric.Image.filters.Brightness({ brightness: value * 2 - 1 }))
              break
            case "grayscale":
              activeObject.filters.push(new window.fabric.Image.filters.Grayscale())
              break
            case "sepia":
              activeObject.filters.push(new window.fabric.Image.filters.Sepia())
              break
            case "invert":
              activeObject.filters.push(new window.fabric.Image.filters.Invert())
              break
          }
          activeObject.applyFilters()
        }
      } else {
        activeObject.set(prop, value)
      }

      fabricCanvasRef.current.renderAll()
    }
  }

  // Canvas dimension handlers
  const applyCanvasSettings = () => {
    if (!fabricCanvasRef.current) return

    // Store the current background image if any
    const currentBgImage = fabricCanvasRef.current.backgroundImage

    // Apply the new dimensions and background color
    fabricCanvasRef.current.setWidth(canvasProps.width)
    fabricCanvasRef.current.setHeight(canvasProps.height)
    fabricCanvasRef.current.setBackgroundColor(
      canvasProps.backgroundColor,
      fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current),
    )

    // If there's a background image, resize it to fit the new dimensions
    if (currentBgImage) {
      const img = currentBgImage.getElement()

      if (img) {
        const imgWidth = img.width || img.naturalWidth
        const imgHeight = img.height || img.naturalHeight
        const canvasWidth = fabricCanvasRef.current.width
        const canvasHeight = fabricCanvasRef.current.height

        // Calculate scale based on fit mode
        let scale
        if (bgImageFit === "cover") {
          // Cover: ensure the image covers the entire canvas
          scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight) * (bgImageScale / 100)
        } else {
          // Contain: ensure the entire image is visible
          scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight) * (bgImageScale / 100)
        }

        // Update background image properties
        currentBgImage.set({
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
          // Center the image on the canvas
          left: canvasWidth / 2,
          top: canvasHeight / 2,
        })
      }
    }

    // Fix canvas container dimensions for proper display
    const fixCanvasContainerStyles = () => {
      const canvasContainer = document.querySelector(".canvas-container")
      if (canvasContainer) {
        // Add initialized class to apply specific styles
        canvasContainer.classList.add("initialized")

        const fabricContainer = canvasContainer.querySelector(".canvas-wrapper")
        if (fabricContainer) {
          fabricContainer.style.width = `${canvasProps.width}px`
          fabricContainer.style.height = `${canvasProps.height}px`
          fabricContainer.style.position = "relative"
          fabricContainer.style.margin = "0 auto"
        }

        // Fix the upper and lower canvas elements
        const canvasElements = canvasContainer.querySelectorAll("canvas")
        canvasElements.forEach((canvas) => {
          canvas.style.position = "absolute"
          canvas.style.left = "0"
          canvas.style.top = "0"
        })
      }
    }

    fixCanvasContainerStyles()

    fabricCanvasRef.current.renderAll()
    toast.success("Canvas settings applied")
  }

  // Object arrangement
  const handleBringForward = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject) {
      fabricCanvasRef.current.bringForward(activeObject)
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleSendBackward = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject) {
      fabricCanvasRef.current.sendBackwards(activeObject)
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleBringToFront = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject) {
      fabricCanvasRef.current.bringToFront(activeObject)
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleSendToBack = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject) {
      fabricCanvasRef.current.sendToBack(activeObject)
      fabricCanvasRef.current.renderAll()
    }
  }

  const handleRemoveObject = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject) {
      // For multiple selection
      if (activeObject.type === 'activeSelection') {
        const objectCount = activeObject._objects.length;
        activeObject.forEachObject(obj => {
          fabricCanvasRef.current.remove(obj);
        });


        toast.info(`Deleted ${objectCount} objects`);
      } else {
        // For single object
        fabricCanvasRef.current.remove(activeObject);
        const objectType = activeObject.type === 'i-text' ? 'Text' : 
                         activeObject.type === 'image' ? 'Image' : 'Shape';
        toast.info(`Deleted ${objectType}`);
      }
      fabricCanvasRef.current.renderAll()
      // Clear the selected object reference
      setSelectedObject(null)
    }
  }

  // Preview handler
  const handlePreview = () => {
    if (!fabricCanvasRef.current) return

    try {
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 1,
      })

      setPreviewImage(dataURL)
      setShowPreview(true)
    } catch (error) {
      console.error("Error generating preview:", error)
      toast.error("Failed to generate preview")
    }
  }

  // Download handler
  const handleDownload = () => {
    if (!fabricCanvasRef.current) return

    try {
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 1,
      })

      const link = document.createElement("a")
      link.download = "wedding-card.png"
      link.href = dataURL
      link.click()
    } catch (error) {
      console.error("Error downloading canvas:", error)
      toast.error("Failed to download card")
    }
  }

  // Save handler - update to handle both create and update
  const saveCardTemplate = async () => {
    if (!fabricCanvasRef.current) {
      toast.error("Canvas not initialized")
      return
    }
  
    try {
      setIsSaving(true)
  
      fabricCanvasRef.current.discardActiveObject()
      fabricCanvasRef.current.renderAll()
  
      const canvasJSON = fabricCanvasRef.current.toJSON([
        'id', 'fieldId', 'editable', 'selectable', 'lockMovementX', 
        'lockMovementY', 'customType', 'type', 'text', 'fontFamily', 
        'fontSize', 'fill', 'opacity', 'top', 'left', 'width', 'height',
        'scaleX', 'scaleY', 'angle', 'originX', 'originY', 'strokeWidth', 
        'stroke', 'textAlign', 'fontWeight', 'fontStyle', 'underline',
        'lineHeight', 'charSpacing', 'backgroundColor', 'src'
      ])
  
      const settings = {
        width: canvasProps.width,
        height: canvasProps.height,
        canvasJSON: canvasJSON,
        editableFields: editableFieldsRef.current,
        bgImageFit: bgImageFit,
        bgImageScale: bgImageScale
      }
  
      console.log("Preparing to save settings with:", {
        canvasDimensions: `${settings.width}x${settings.height}`,
        objectCount: canvasJSON.objects ? canvasJSON.objects.length : 'unknown',
        editableFieldsCount: editableFieldsRef.current.length
      })
  
      const cardImageData = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 0.8,
        multiplier: 1
      })
  
      const formData = new FormData()
      
      formData.append("type", "editable")
      formData.append("name", cardData.name || "Untitled Card") // Added to ensure name is included
      
      if (cardData) {
        formData.append("price_per_card", cardData.price_per_card || 0)
        formData.append("quantity_available", cardData.quantity_available || 0)
        formData.append("city", cardData.city || "") // Ensure single string
        formData.append("design_time", cardData.design_time || "7-10 days")
        formData.append("description", cardData.description || "Customizable wedding card")
        
        if (Array.isArray(cardData.format) && cardData.format.length > 0) {
          cardData.format.forEach(format => {
            formData.append("format", format)
          })
        } else if (typeof cardData.format === 'string') {
          const formats = cardData.format.split(',').map(f => f.trim())
          formats.forEach(format => {
            if (format) formData.append("format", format)
          })
        } else {
          formData.append("format", "PNG")
        }
      } else {
        formData.append("price_per_card", 500)
        formData.append("quantity_available", 100)
        formData.append("city", "Lahore")
        formData.append("design_time", "7-10 days")
        formData.append("description", "Customizable wedding card")
        formData.append("format", "PNG")
      }
      
      const settingsString = JSON.stringify(settings)
      console.log(`Settings string size: ${settingsString.length} bytes`)
      
      if (settingsString.length > 15 * 1024 * 1024) {
        throw new Error("Settings data is too large (>15MB). Please reduce complexity of your design.")
      }
      
      formData.append("settings", settingsString)
      
      try {
        const blob = await (await fetch(cardImageData)).blob()
        formData.append("front_image", blob, "card-preview.png")
        console.log(`Preview image size: ~${Math.round(blob.size / 1024)} KB`)
      } catch (error) {
        console.error("Error creating preview image:", error)
        throw new Error("Failed to create preview image: " + error.message)
      }
  
      const apiConfig = {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000
      }
  
      let response
      if (isEditMode && cardId) {
        console.log(`Updating existing card: ${cardId}`)
        response = await api.put(`/vendor/dashboard/cards/${cardId}`, formData, apiConfig)
        toast.success("Card updated successfully")
      } else {
        console.log("Creating new card")
        response = await api.post("/vendor/dashboard/cards", formData, apiConfig)
        toast.success("Card created successfully")
      }
  
      console.log("Card saved successfully:", response.data)
      
      setTimeout(() => {
        navigate("/vendor/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error saving card:", error)
      let errorMessage = "Failed to save card"
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Create new canvas
  const handleNewCanvas = () => {
    if (
      fabricCanvasRef.current &&
      (!window.confirm("Are you sure you want to create a new canvas? All unsaved changes will be lost.") || isSaving)
    )
      return

    // Show modal for new canvas settings
    const width = window.prompt("Enter canvas width (px):", "800")
    const height = window.prompt("Enter canvas height (px):", "600")
    const color = "#ffffff"

    if (!width || !height) return

    // Clear canvas and set new dimensions
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.setWidth(Number.parseInt(width))
    fabricCanvasRef.current.setHeight(Number.parseInt(height))
    fabricCanvasRef.current.setBackgroundColor(color, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current))

    // Update state
    setCanvasProps({
      width: Number.parseInt(width),
      height: Number.parseInt(height),
      backgroundColor: color,
    })
  }

  // Toggle properties panel for responsive design
  const togglePropertiesPanel = () => {
    setShowPropertiesPanel(!showPropertiesPanel)
  }

  return (
    <div className="card-editor-container">
      <nav className="editor-navbar">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            EazyWed Card Editor
          </a>
          <div className="editor-nav-actions">
            <button
              className="btn btn-light btn-sm"
              onClick={handleNewCanvas}
              disabled={isSaving}
              title="Create New Canvas"
            >
              <i className="fas fa-file"></i> New Canvas
            </button>
            <button
              className="btn btn-light btn-sm"
              onClick={handleDownload}
              disabled={isSaving || isLoading}
              title="Download Card"
            >
              <i className="fas fa-download"></i> Download
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={saveCardTemplate}
              disabled={isSaving || isLoading}
              title={isEditMode ? "Update Card Template" : "Save Card Template"}
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> {isEditMode ? "Update Card" : "Submit Design"}
                </>
              )}
            </button>
            <button
              className="btn btn-light btn-sm d-lg-none"
              onClick={togglePropertiesPanel}
              title="Toggle Properties Panel"
            >
              <i className="fas fa-sliders-h"></i>
            </button>
          </div>
        </div>
      </nav>

      <div className="editor-container">
        {/* Left Toolbar */}
        <div className="toolbar">
          <button
            className={`toolbar-btn ${currentTool === "assets" ? "active" : ""}`}
            onClick={() => {
              setCurrentTool("assets")
              setShowAssetsPanel(!showAssetsPanel)
            }}
            title="Assets"
          >
            <i className="fas fa-images"></i>
          </button>
          <button
            className={`toolbar-btn ${currentTool === "text" ? "active" : ""}`}
            onClick={() => {
              setCurrentTool("text")
              setShowAssetsPanel(false)
              handleAddText()
            }}
            title="Add Text"
          >
            <i className="fas fa-font"></i>
          </button>
          <button
            className={`toolbar-btn ${currentTool === "shape" ? "active" : ""}`}
            onClick={() => {
              setCurrentTool("shape")
              setShowAssetsPanel(false)
            }}
            title="Add Shape"
          >
            <i className="fas fa-shapes"></i>
          </button>
          <button
            className={`toolbar-btn ${currentTool === "canvas" ? "active" : ""}`}
            onClick={() => {
              setCurrentTool("canvas")
              setShowAssetsPanel(false)
            }}
            title="Canvas Settings"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>

        {/* Assets Panel */}
        {showAssetsPanel && (
          <div className="assets-panel">
            <h5 className="panel-title">Assets Library</h5>
            <div className="mb-3">
              <label className="form-label">Upload New Asset</label>
              <input
                type="file"
                className="form-control"
                ref={assetInputRef}
                accept="image/*"
                multiple
                onChange={handleAssetUpload}
              />
            </div>
            <div className="assets-grid">
              {assets.map((asset) => (
                <div className="asset-item" key={asset.id}>
                  <img src={asset.src || "/placeholder.svg"} alt={asset.name} onClick={() => handleUseAsset(asset)} />
                  <div className="asset-remove" onClick={() => handleRemoveAsset(asset.id)}>
                    <i className="fas fa-times"></i>
                  </div>
                </div>
              ))}
              {assets.length === 0 && <div className="text-center p-4">No assets uploaded yet</div>}
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="canvas-container">
          <div
            id="canvas-wrapper"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.3s",
              width: `${canvasProps.width}px`,
              height: `${canvasProps.height}px`,
            }}
          >
            <canvas id="canvas" ref={canvasRef}></canvas>
          </div>

          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button onClick={handleZoomOut} title="Zoom Out">
              <i className="fas fa-minus"></i>
            </button>
            <span>{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} title="Zoom In">
              <i className="fas fa-plus"></i>
            </button>
            <button onClick={handleZoomReset} title="Reset Zoom">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>

          {/* Layer Controls */}
          <div className="layer-controls">
            <button onClick={handleBringForward} title="Bring Forward">
              <i className="fas fa-arrow-up"></i>
            </button>
            <button onClick={handleSendBackward} title="Send Backward">
              <i className="fas fa-arrow-down"></i>
            </button>
            <button onClick={handleBringToFront} title="Bring to Front">
              <i className="fas fa-level-up-alt"></i>
            </button>
            <button onClick={handleSendToBack} title="Send to Back">
              <i className="fas fa-level-down-alt"></i>
            </button>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className={`properties-panel ${showPropertiesPanel ? "active" : ""}`}>
          {/* Text Properties */}
          {currentTool === "text" && (
            <div className="panel-section">
              <h5 className="panel-title">Text Properties</h5>
              <div className="mb-3">
                <label className="form-label">Text Content</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={selectedObject?.text || ""}
                  onChange={(e) => handleTextPropChange("text", e.target.value)}
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Font Family</label>
                <select
                  className="form-select"
                  value={textProps.fontFamily}
                  onChange={(e) => handleTextPropChange("fontFamily", e.target.value)}
                >
                  {availableFonts.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
                <button className="btn btn-sm btn-outline-primary mt-2" onClick={handleAddCustomFont}>
                  <i className="fas fa-plus"></i> Add Custom Font
                </button>
                <input
                  type="file"
                  ref={customFontInputRef}
                  style={{ display: "none" }}
                  accept=".ttf,.otf"
                  onChange={handleCustomFontUpload}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Font Size</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={textProps.fontSize}
                  onChange={(e) => handleTextPropChange("fontSize", Number.parseInt(e.target.value))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Line Height</label>
                <input
                  type="number"
                  className="form-control"
                  min="0.1"
                  step="0.1"
                  value={textProps.lineHeight}
                  onChange={(e) => handleTextPropChange("lineHeight", Number.parseFloat(e.target.value))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Letter Spacing</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  step="10"
                  value={textProps.charSpacing}
                  onChange={(e) => handleTextPropChange("charSpacing", Number.parseInt(e.target.value))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Font Style</label>
                <div className="btn-group w-100">
                  <button
                    className={`btn btn-outline-secondary ${textProps.fontWeight === "bold" ? "active" : ""}`}
                    onClick={() =>
                      handleTextPropChange("fontWeight", textProps.fontWeight === "bold" ? "normal" : "bold")
                    }
                  >
                    <i className="fas fa-bold"></i>
                  </button>
                  <button
                    className={`btn btn-outline-secondary ${textProps.fontStyle === "italic" ? "active" : ""}`}
                    onClick={() =>
                      handleTextPropChange("fontStyle", textProps.fontStyle === "italic" ? "normal" : "italic")
                    }
                  >
                    <i className="fas fa-italic"></i>
                  </button>
                  <button
                    className={`btn btn-outline-secondary ${textProps.underline ? "active" : ""}`}
                    onClick={() => handleTextPropChange("underline", !textProps.underline)}
                  >
                    <i className="fas fa-underline"></i>
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Text Color</label>
                <input
                  type="color"
                  className="form-control"
                  value={textProps.fill}
                  onChange={(e) => handleTextPropChange("fill", e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Text Alignment</label>
                <div className="btn-group w-100">
                  <button
                    className={`btn btn-outline-secondary ${textProps.textAlign === "left" ? "active" : ""}`}
                    onClick={() => handleTextPropChange("textAlign", "left")}
                  >
                    <i className="fas fa-align-left"></i>
                  </button>
                  <button
                    className={`btn btn-outline-secondary ${textProps.textAlign === "center" ? "active" : ""}`}
                    onClick={() => handleTextPropChange("textAlign", "center")}
                  >
                    <i className="fas fa-align-center"></i>
                  </button>
                  <button
                    className={`btn btn-outline-secondary ${textProps.textAlign === "right" ? "active" : ""}`}
                    onClick={() => handleTextPropChange("textAlign", "right")}
                  >
                    <i className="fas fa-align-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Properties */}
          {currentTool === "image" && (
            <div className="panel-section">
              <h5 className="panel-title">Image Properties</h5>
              <div className="mb-3">
                <label className="form-label">Opacity</label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={imageProps.opacity}
                  onChange={(e) => handleImagePropChange("opacity", Number.parseFloat(e.target.value))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Filters</label>
                <select
                  className="form-select"
                  value={imageProps.filter}
                  onChange={(e) => handleImagePropChange("filter", e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="sepia">Sepia</option>
                  <option value="invert">Invert</option>
                  <option value="blur">Blur</option>
                  <option value="brightness">Brightness</option>
                </select>
              </div>
              {imageProps.filter !== "none" && (imageProps.filter === "blur" || imageProps.filter === "brightness") && (
                <div className="mb-3">
                  <label className="form-label">Filter Intensity</label>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={imageProps.filterValue}
                    onChange={(e) => handleImagePropChange("filterValue", Number.parseFloat(e.target.value))}
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">Border</label>
                <div className="d-flex gap-2">
                  <input
                    type="color"
                    className="form-control"
                    value={imageProps.stroke}
                    onChange={(e) => handleImagePropChange("stroke", e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="50"
                    value={imageProps.strokeWidth}
                    onChange={(e) => handleImagePropChange("strokeWidth", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Canvas Properties */}
          {currentTool === "canvas" && (
            <div className="panel-section">
              <h5 className="panel-title">Canvas Settings</h5>
              <div className="mb-3">
                <label className="form-label">Width (px)</label>
                <input
                  type="number"
                  className="form-control"
                  min="100"
                  value={canvasProps.width}
                  onChange={(e) =>
                    setCanvasProps({ ...canvasProps, width: Math.max(100, Number.parseInt(e.target.value) || 100) })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Height (px)</label>
                <input
                  type="number"
                  className="form-control"
                  min="100"
                  value={canvasProps.height}
                  onChange={(e) =>
                    setCanvasProps({ ...canvasProps, height: Math.max(100, Number.parseInt(e.target.value) || 100) })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Background Color</label>
                <input
                  type="color"
                  className="form-control"
                  value={canvasProps.backgroundColor}
                  onChange={(e) => setCanvasProps({ ...canvasProps, backgroundColor: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Background Image</label>
                <input
                  type="file"
                  className="form-control"
                  ref={bgImageInputRef}
                  accept="image/*"
                  onChange={handleSetBackgroundImage}
                />
                {fabricCanvasRef.current?.backgroundImage && (
                  <button
                    className="btn btn-sm btn-outline-danger mt-2"
                    onClick={() => {
                      if (fabricCanvasRef.current) {
                        fabricCanvasRef.current.setBackgroundImage(
                          null,
                          fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current),
                        )
                      }
                    }}
                  >
                    Remove Background Image
                  </button>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Background Image Fit</label>
                <select className="form-select" value={bgImageFit} onChange={(e) => setBgImageFit(e.target.value)}>
                  <option value="cover">Cover (Fill Canvas)</option>
                  <option value="contain">Contain (Show Full Image)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Background Image Scale ({bgImageScale}%)</label>
                <input
                  type="range"
                  className="form-range"
                  min="50"
                  max="150"
                  step="5"
                  value={bgImageScale}
                  onChange={(e) => setBgImageScale(Number.parseInt(e.target.value))}
                />
              </div>
              <button className="btn btn-primary w-100" onClick={applyCanvasSettings}>
                Apply Settings
              </button>
            </div>
          )}

          {/* Shape Properties */}
          {currentTool === "shape" && (
            <div className="panel-section">
              <h5 className="panel-title">Shape Properties</h5>
              <div className="mb-3">
                <label className="form-label">Shape Type</label>
                <select
                  className="form-select"
                  value={shapeProps.type}
                  onChange={(e) => setShapeProps({ ...shapeProps, type: e.target.value })}
                >
                  <option value="rect">Rectangle</option>
                  <option value="circle">Circle</option>
                  <option value="triangle">Triangle</option>
                  <option value="line">Line</option>
                  <option value="polygon">Polygon</option>
                  <option value="star">Star</option>
                  <option value="heart">Heart</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Fill Color</label>
                <input
                  type="color"
                  className="form-control"
                  value={shapeProps.fill}
                  onChange={(e) => handleShapePropChange("fill", e.target.value)}
                  disabled={shapeProps.transparentFill}
                />
                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={shapeProps.transparentFill}
                    onChange={(e) => handleShapePropChange("transparentFill", e.target.checked)}
                  />
                  <label className="form-check-label">Transparent Fill</label>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Border Color</label>
                <input
                  type="color"
                  className="form-control"
                  value={shapeProps.stroke}
                  onChange={(e) => handleShapePropChange("stroke", e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Border Width</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="50"
                  value={shapeProps.strokeWidth}
                  onChange={(e) => handleShapePropChange("strokeWidth", Number.parseInt(e.target.value))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Opacity</label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={shapeProps.opacity}
                  onChange={(e) => handleShapePropChange("opacity", Number.parseFloat(e.target.value))}
                />
              </div>
              <button className="btn btn-primary w-100" onClick={handleAddShape}>
                Add Shape
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p className="loading-text">Loading editor...</p>
        </div>
      )}

      {isSaving && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p className="loading-text">Saving card template...</p>
        </div>
      )}

      {showPreview && (
        <div className="preview-modal">
          <div className="preview-content">
            <button className="preview-close" onClick={() => setShowPreview(false)}>
              &times;
            </button>
            <h5>Card Preview</h5>
            <div className="preview-image">
              <img src={previewImage || "/placeholder.svg"} alt="Card Preview" />
            </div>
            <button className="btn btn-primary mt-3" onClick={() => setShowPreview(false)}>
              Close Preview
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default CardEditor