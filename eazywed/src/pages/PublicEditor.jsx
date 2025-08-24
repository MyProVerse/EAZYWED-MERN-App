"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/card-editor.css"
import { fetchCardEditDetails } from "../services/api"

// Declare fabric as a global variable
let fabric

const PublicEditor = () => {
  const navigate = useNavigate()
  const { cardId } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [cardData, setCardData] = useState(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true)
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
  const [loadedFonts, setLoadedFonts] = useState([
    "Poppins",
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
  ])

  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const customFontInputRef = useRef(null)

  // Load Fabric.js library
  useEffect(() => {
    const loadFabricJS = async () => {
      if (typeof window.fabric === "undefined") {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"
            script.async = true
            script.onload = () => {
              fabric = window.fabric
              resolve()
            }
            script.onerror = () => reject(new Error("Failed to load Fabric.js"))
            document.head.appendChild(script)
          })
          // Preload default fonts
          preloadFonts(loadedFonts)
        } catch (error) {
          toast.error("Failed to load editor library")
          setIsLoading(false)
        }
      } else {
        fabric = window.fabric
        preloadFonts(loadedFonts)
      }
    }

    loadFabricJS()
  }, [])

  // Add keyboard event listener for deleting objects
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!fabricCanvasRef.current) return
      const activeObject = fabricCanvasRef.current.getActiveObject()
      if (!activeObject) return
      if (activeObject.type === "i-text" && activeObject.isEditing) return
      // Prevent object deletion if textarea is focused
      if (document.activeElement.tagName.toLowerCase() === "textarea") return
      if (e.key === "Delete" || e.key === "Backspace") {
        handleRemoveObject()
        e.preventDefault()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Fetch card details without authentication check
  useEffect(() => {
    const loadCard = async () => {
      try {
        const data = await fetchCardEditDetails(cardId)
        if (data.type !== "editable") {
          toast.error("This card is not editable")
          navigate("/services/cards")
          return
        }
        setCardData(data)
      } catch (err) {
        console.error("Error fetching card details:", err)
        toast.error("Failed to load card details: " + (err.message || "Unknown error"))
        navigate("/services/cards")
      }
    }

    if (cardId) {
      loadCard()
    }
  }, [cardId, navigate])

  // Initialize canvas once fabric is loaded and card data is available
  useEffect(() => {
    if (fabric && cardData && canvasRef.current) {
      const cleanup = setupCanvas(cardData.settings, cardData.frontImage)
      return cleanup
    }
  }, [fabric, cardData])

  // Preload fonts for better rendering
  const preloadFonts = (fontList) => {
    fontList.forEach((fontName) => {
      if (!document.fonts.check(`12px "${fontName}"`)) {
        const link = document.createElement("link")
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(" ", "+")}&display=swap`
        link.rel = "stylesheet"
        document.head.appendChild(link)
      }
    })
  }

  const setupCanvas = (settings, frontImage) => {
    let parsedSettings = settings
    if (typeof settings === "string") {
      try {
        parsedSettings = JSON.parse(settings)
      } catch (error) {
        console.error("Error parsing settings:", error)
        toast.error("Invalid card settings format")
        setIsLoading(false)
        return
      }
    }

    if (!parsedSettings || !parsedSettings.canvasJSON || !parsedSettings.width || !parsedSettings.height) {
      toast.error("Invalid or incomplete card settings")
      setIsLoading(false)
      return
    }

    try {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: parsedSettings.width,
        height: parsedSettings.height,
        backgroundColor: parsedSettings.canvasJSON.backgroundColor || "#ffffff",
        preserveObjectStacking: true,
        selection: true,
      })

      // Load background image if specified
      if (frontImage) {
        fabric.Image.fromURL(
          frontImage,
          (img) => {
            const scaleX = parsedSettings.width / img.width
            const scaleY = parsedSettings.height / img.height
            img.set({
              scaleX: scaleX,
              scaleY: scaleY,
              left: parsedSettings.width / 2,
              top: parsedSettings.height / 2,
              originX: "center",
              originY: "center",
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
            })
            fabricCanvasRef.current.setBackgroundImage(
              img,
              fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current)
            )
          },
          { crossOrigin: "anonymous" }
        )
      }

      // Load canvas from JSON
      fabricCanvasRef.current.loadFromJSON(parsedSettings.canvasJSON, () => {
        fabricCanvasRef.current.getObjects().forEach((obj) => {
          if (obj.type === "i-text" || obj.type === "textbox") {
            obj.set({
              selectable: true,
              editable: true,
              lockMovementX: true,
              lockMovementY: true,
            })
            // Preload font if not already loaded
            if (obj.fontFamily && !loadedFonts.includes(obj.fontFamily)) {
              preloadFonts([obj.fontFamily])
              setLoadedFonts((prev) => [...prev, obj.fontFamily])
            }
          } else {
            obj.set({
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
            })
          }
        })
        fabricCanvasRef.current.renderAll()
        setIsLoading(false)
      })

      // Add selection event listeners
      fabricCanvasRef.current.on("selection:created", handleSelectionCreated)
      fabricCanvasRef.current.on("selection:updated", handleSelectionUpdated)
      fabricCanvasRef.current.on("selection:cleared", handleSelectionCleared)

      // Fit canvas to window
      fitCanvasToWindow()

      return () => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.off("selection:created", handleSelectionCreated)
          fabricCanvasRef.current.off("selection:updated", handleSelectionUpdated)
          fabricCanvasRef.current.off("selection:cleared", handleSelectionCleared)
          fabricCanvasRef.current.dispose()
        }
      }
    } catch (error) {
      console.error("Error setting up canvas:", error)
      toast.error("Failed to initialize editor: " + (error.message || "Unknown error"))
      setIsLoading(false)
    }
  }

  // Fit canvas to window
  const fitCanvasToWindow = () => {
    if (!fabricCanvasRef.current) return
    const container = document.querySelector(".canvas-container")
    if (!container) return
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const canvasWidth = fabricCanvasRef.current.getWidth()
    const canvasHeight = fabricCanvasRef.current.getHeight()
    const widthRatio = (containerWidth - 60) / canvasWidth
    const heightRatio = (containerHeight - 60) / canvasHeight
    const newZoom = Math.min(widthRatio, heightRatio, 1)
    setZoomLevel(newZoom)
  }

  const handleSelectionCreated = (e) => {
    const activeObject = e.selected[0]
    if (activeObject.type === "i-text" || activeObject.type === "textbox") {
      setSelectedObject(activeObject)
      updateTextProps(activeObject)
    }
  }

  const handleSelectionUpdated = (e) => {
    const activeObject = e.selected[0]
    if (activeObject.type === "i-text" || activeObject.type === "textbox") {
      setSelectedObject(activeObject)
      updateTextProps(activeObject)
    }
  }

  const handleSelectionCleared = () => {
    setSelectedObject(null)
  }

  const updateTextProps = (activeObject) => {
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
  }

  const handleTextPropChange = (prop, value) => {
    setTextProps({ ...textProps, [prop]: value })
    const activeObject = fabricCanvasRef.current?.getActiveObject()
    if (activeObject && (activeObject.type === "i-text" || activeObject.type === "textbox")) {
      if (prop === "fontFamily" && !loadedFonts.includes(value)) {
        preloadFonts([value])
        setLoadedFonts((prev) => [...prev, value])
      }
      // Allow empty text to preserve the text object
      activeObject.set(prop, value)
      fabricCanvasRef.current.renderAll()
    }
  }

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
        const fontFace = new FontFace(fontName, event.target.result)
        fontFace.load().then((loadedFace) => {
          document.fonts.add(loadedFace)
          setLoadedFonts((prev) => [...prev, fontName])
          setTextProps((prev) => ({ ...prev, fontFamily: fontName }))
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

  const handleDownload = () => {
    if (!fabricCanvasRef.current) {
      toast.error("Editor not initialized")
      return
    }

    try {
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 1,
      })
      const link = document.createElement("a")
      link.download = "customized-wedding-card.png"
      link.href = dataURL
      link.click()
    } catch (error) {
      console.error("Error downloading canvas:", error)
      toast.error("Failed to download card: " + (error.message || "Unknown error"))
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

  const handleRemoveObject = () => {
    if (!fabricCanvasRef.current) return
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject && (activeObject.type === "i-text" || activeObject.type === "textbox")) {
      fabricCanvasRef.current.remove(activeObject)
      fabricCanvasRef.current.renderAll()
      setSelectedObject(null)
      toast.info("Deleted Text")
    }
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
            Customize Your Wedding Card
          </a>
          <div className="editor-nav-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownload}
              disabled={isLoading}
              title="Download Card"
            >
              <i className="fas fa-download"></i> Download
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
            className="toolbar-btn active"
            title="Text Properties"
            onClick={() => setShowPropertiesPanel(true)}
          >
            <i className="fas fa-font"></i>
          </button>
        </div>

        {/* Main Canvas Area */}
        <div className="canvas-container">
          <div
            id="canvas-wrapper"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.3s",
              width: `${cardData?.settings?.width || 800}px`,
              height: `${cardData?.settings?.height || 600}px`,
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
        </div>

        {/* Right Properties Panel */}
        {selectedObject && (
          <div className={`properties-panel ${showPropertiesPanel ? "active" : ""}`}>
            <div className="panel-section">
              <h5 className="panel-title">Text Properties</h5>
              <div className="mb-3">
                <label className="form-label">Text Content</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={selectedObject.text || ""}
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
                  {loadedFonts.map((font) => (
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
                <label className="form-label">Text Color</label>
                <input
                  type="color"
                  className="form-control"
                  value={textProps.fill}
                  onChange={(e) => handleTextPropChange("fill", e.target.value)}
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
          </div>
        )}
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p className="loading-text">Loading editor...</p>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default PublicEditor