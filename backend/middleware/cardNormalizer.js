export const normalizeCardRequest = (req, res, next) => {
  try {
    const contentType = req.headers["content-type"] || "";
    console.log(`Card normalizer: ${req.method} ${req.path} (${contentType.split(';')[0]})`);

    if (contentType.startsWith("multipart/form-data")) {
      const fields = req.body;
      const files = req.files || {};

      console.log("Normalizing card fields:", Object.keys(fields).join(", "));
      
      // Validate name field
      let name = fields.name ? fields.name.trim() : "";
      if (name && (name.length < 3 || name.length > 100)) {
        return res.status(400).json({
          message: "Card name must be between 3 and 100 characters",
        });
      }

      const normalizedBody = {
        type: fields.type,
        price_per_card: parseFloat(fields.price_per_card) || 0,
        quantity_available: parseInt(fields.quantity_available) || 0,
        city: fields.city,
        name,
        design_time: fields.design_time,
        description: fields.description || "",
        format: fields.format ? (Array.isArray(fields.format) ? fields.format : [fields.format]) : [],
      };

      if (fields.settings) {
        try {
          const settingsType = typeof fields.settings;
          console.log(`Processing settings (${settingsType}, length: ${settingsType === 'string' ? fields.settings.length : 'unknown'})`);
          
          if (settingsType === 'string') {
            const testParse = JSON.parse(fields.settings);
            if (testParse && testParse.canvasJSON) {
              console.log("Settings contains valid canvasJSON structure");
            } else {
              console.warn("Settings missing canvasJSON or has invalid structure");
            }
            normalizedBody.settings = fields.settings;
          } else {
            normalizedBody.settings = JSON.stringify(fields.settings);
            console.log("Converted non-string settings to JSON string");
          }
        } catch (error) {
          console.error("Invalid settings JSON format:", error.message);
          return res.status(400).json({ 
            message: "Invalid settings format - please recreate your design", 
            error: error.message 
          });
        }
      } else {
        console.log("No settings field in request");
      }

      if (files.front_image) {
        if (files.front_image.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            message: "Front image size exceeds 5MB limit",
          });
        }
        normalizedBody.front_image = files.front_image;
        console.log(`Front image included (${Math.round(files.front_image.size / 1024)}KB)`);
      }

      req.normalizedBody = normalizedBody;
    } else {
      req.normalizedBody = req.body;
      if (!req.normalizedBody.name) {
        req.normalizedBody.name = "";
      }
      // Validate name field
      if (req.normalizedBody.name && (req.normalizedBody.name.length < 3 || req.normalizedBody.name.length > 100)) {
        return res.status(400).json({
          message: "Card name must be between 3 and 100 characters",
        });
      }
      req.normalizedBody.name = req.normalizedBody.name.trim();
      
      if (req.normalizedBody.format && !Array.isArray(req.normalizedBody.format)) {
        req.normalizedBody.format = [req.normalizedBody.format];
      }
      
      if (!req.normalizedBody.city) {
        req.normalizedBody.city = "";
      }
      
      if (req.normalizedBody.settings && typeof req.normalizedBody.settings === 'string') {
        try {
          JSON.parse(req.normalizedBody.settings);
          console.log("Validated settings JSON string from request");
        } catch (error) {
          console.error("Invalid settings JSON in request:", error.message);
          return res.status(400).json({ 
            message: "Invalid settings format in request", 
            error: error.message 
          });
        }
      } else if (req.normalizedBody.settings) {
        try {
          req.normalizedBody.settings = JSON.stringify(req.normalizedBody.settings);
          console.log("Converted settings object to JSON string");
        } catch (error) {
          console.error("Failed to stringify settings:", error);
          return res.status(400).json({ 
            message: "Invalid settings structure", 
            error: error.message 
          });
        }
      }
    }
    
    console.log("Card request normalized successfully");
    next();
  } catch (error) {
    console.error("Error in normalizeCardRequest middleware:", error);
    res.status(400).json({ 
      message: "Invalid request format", 
      error: error.message || "Unknown error" 
    });
  }
};