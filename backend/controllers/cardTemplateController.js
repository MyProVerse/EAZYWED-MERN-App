import CardTemplate from "../models/CardTemplate.js"
import Booking from "../models/Booking.js"
import { uploadCardImage } from "../utils/cloudinary.js"

export const createCardTemplate = async (req, res) => {
  try {
    const vendorId = req.user.id
    const cardData = req.normalizedBody

    if (
      !cardData.type ||
      !cardData.price_per_card ||
      !cardData.quantity_available ||
      !cardData.city ||
      !cardData.name || // Added name to required fields check
      !cardData.format ||
      !cardData.design_time
    ) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    if (cardData.type === "static" || cardData.type === "non-editable") {
      if (!cardData.front_image) {
        return res.status(400).json({ message: "Front image is required for static/non-editable cards" })
      }

      try {
        const imageUrl = await uploadCardImage(cardData.front_image)
        cardData.front_image = imageUrl
      } catch (error) {
        console.error("Error uploading image:", error)
        return res.status(500).json({ message: "Error uploading image", error: error.message })
      }
    }

    if (cardData.type === "editable" || cardData.type === "simple") {
      if (!cardData.settings && !cardData.front_image) {
        return res.status(400).json({ message: "Either settings or front image is required for editable cards" })
      }

      if (cardData.front_image) {
        try {
          const imageUrl = await uploadCardImage(cardData.front_image)
          cardData.front_image = imageUrl
        } catch (error) {
          console.error("Error uploading image:", error)
          return res.status(500).json({ message: "Error uploading image", error: error.message })
        }
      }
    }

    const newCard = new CardTemplate({
      ...cardData,
      vendor_id: vendorId,
      status: "pending",
    })

    await newCard.save()
    res.status(201).json({ message: "Card template created successfully", card: newCard })
  } catch (error) {
    console.error("Error creating card template:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const getCardTemplateById = async (req, res) => {
  try {
    const vendorId = req.user.id
    const cardId = req.params.cardId

    const card = await CardTemplate.findOne({ _id: cardId, vendor_id: vendorId })
    if (!card) {
      return res.status(404).json({ message: "Card template not found" })
    }

    res.status(200).json(card)
  } catch (error) {
    console.error("Error fetching card template:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const updateCardTemplate = async (req, res) => {
  try {
    const vendorId = req.user.id
    const cardId = req.params.cardId
    const updateData = req.normalizedBody

    console.log(`Updating card ${cardId} with fields: ${Object.keys(updateData).join(", ")}`)
    
    const card = await CardTemplate.findOne({ _id: cardId, vendor_id: vendorId })
    if (!card) {
      console.log(`Card ${cardId} not found for vendor ${vendorId}`)
      return res.status(404).json({ message: "Card template not found" })
    }

    console.log(`Found card: type=${card.type}, hasSettings=${!!card.settings}`)

    if (!updateData.city) {
      return res.status(400).json({ message: "City is required" })
    }

    if (updateData.front_image) {
      try {
        console.log("Uploading new front image")
        const imageUrl = await uploadCardImage(updateData.front_image)
        updateData.front_image = imageUrl
      } catch (error) {
        console.error("Error uploading image:", error.message)
        return res.status(500).json({ 
          message: "Failed to upload image", 
          error: error.message 
        })
      }
    }

    if (card.type === "editable") {
      if (!updateData.settings && card.settings) {
        console.log("Preserving existing settings")
        updateData.settings = card.settings
      } else if (updateData.settings) {
        console.log("New settings provided")
        
        if (typeof updateData.settings === 'string') {
          try {
            const parsedSettings = JSON.parse(updateData.settings)
            if (!parsedSettings.canvasJSON) {
              console.warn("New settings missing canvasJSON property")
            }
          } catch (error) {
            console.error("Invalid settings JSON:", error.message)
            return res.status(400).json({ 
              message: "Invalid settings format", 
              error: error.message 
            })
          }
        } else {
          try {
            updateData.settings = JSON.stringify(updateData.settings)
            console.log("Converted settings object to JSON string")
          } catch (error) {
            console.error("Failed to stringify settings:", error.message)
            return res.status(400).json({ 
              message: "Invalid settings structure", 
              error: error.message 
            })
          }
        }
      }
    }

    if (card.status === "published" && (updateData.front_image || updateData.settings)) {
      updateData.status = "pending"
      console.log("Setting card status to pending due to significant changes")
    }

    const updatedCard = await CardTemplate.findByIdAndUpdate(
      cardId, 
      updateData, 
      { 
        new: true,
        runValidators: true
      }
    )

    if (!updatedCard) {
      console.error(`Failed to update card ${cardId}`)
      return res.status(500).json({ message: "Failed to update card" })
    }

    console.log(`Card ${cardId} updated successfully`)
    res.status(200).json({ 
      message: "Card template updated successfully", 
      card: updatedCard 
    })
  } catch (error) {
    console.error("Error updating card template:", error.message)
    res.status(500).json({ 
      message: "Failed to update card", 
      error: error.message || "Unknown error" 
    })
  }
}

export const deleteCardTemplate = async (req, res) => {
  try {
    const vendorId = req.user.id
    const cardId = req.params.cardId

    const card = await CardTemplate.findOne({ _id: cardId, vendor_id: vendorId })
    if (!card) {
      return res.status(404).json({ message: "Card template not found" })
    }

    const bookings = await Booking.countDocuments({ card_template_id: cardId })
    if (bookings > 0) {
      return res.status(400).json({ message: "Cannot delete card template with existing bookings" })
    }

    await CardTemplate.findByIdAndDelete(cardId)
    res.status(200).json({ message: "Card template deleted successfully" })
  } catch (error) {
    console.error("Error deleting card template:", error)
    res.status(500).json({ message: "Server error" })
  }
}