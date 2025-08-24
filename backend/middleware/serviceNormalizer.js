export const normalizeServiceRequest = (req, res, next) => {
  try {
    req.normalizedBody = {}

    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      req.normalizedBody.category = req.body.category
      req.normalizedBody.name = req.body.name
      req.normalizedBody.city = req.body.city
      req.normalizedBody.address = req.body.address
      req.normalizedBody.location_map = req.body.location_map
      req.normalizedBody.description = req.body.description
      req.normalizedBody.additional_info = req.body.additional_info
      req.normalizedBody.price_range = req.body.price_range
      req.normalizedBody.discount = req.body.discount || ""
      req.normalizedBody.discount_expiry = req.body.discount_expiry || ""

      req.normalizedBody.availability = {
        working_hours: req.body["availability[working_hours]"],
        working_days: Array.isArray(req.body["availability[working_days][]"])
          ? req.body["availability[working_days][]"]
          : [req.body["availability[working_days][]"]],
      }

      const details = {}
      for (const key in req.body) {
        if (key.startsWith("details[")) {
          const field = key.match(/details\[(.*?)\]/)[1]
          if (key.endsWith("[]")) {
            const arrayField = field.replace("[]", "")
            if (!details[arrayField]) {
              details[arrayField] = []
            }
            if (Array.isArray(req.body[key])) {
              details[arrayField] = req.body[key]
            } else {
              details[arrayField].push(req.body[key])
            }
          } else {
            let value = req.body[key]
            if (value === "true") value = true
            if (value === "false") value = false
            if (!isNaN(value) && value !== "") value = Number(value)

            details[field] = value
          }
        }
      }
      req.normalizedBody.details = details

      const packages = []
      const packageIndices = new Set()
      for (const key in req.body) {
        if (key.startsWith("pricing_packages[")) {
          const match = key.match(/pricing_packages\[(\d+)\]\[(.*?)\]/)
          if (match) {
            const index = Number.parseInt(match[1])
            packageIndices.add(index)
          }
        }
      }

      packageIndices.forEach((index) => {
        const pkg = {
          name: req.body[`pricing_packages[${index}][name]`] || "",
          price: Number.parseFloat(req.body[`pricing_packages[${index}][price]`]) || 0,
          inclusions: req.body[`pricing_packages[${index}][inclusions]`] || "",
        }
        if (pkg.name && pkg.price > 0) {
          packages.push(pkg)
        }
      })

      req.normalizedBody.pricing_packages = packages

      if (req.files?.photos) {
        req.normalizedBody.photos = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos]
      }
    } else {
      req.normalizedBody = req.body
    }

    next()
  } catch (error) {
    console.error("Service request normalization error:", error)
    res.status(400).json({ message: "Invalid service request format" })
  }
}