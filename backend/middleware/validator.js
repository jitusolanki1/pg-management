export const validateTenant = (req, res, next) => {
  const {
    name,
    age,
    profilePhoto,
    aadhaarFront,
    aadhaarBack,
    plan,
    bed,
    phone,
  } = req.body;

  if (
    !name ||
    !age ||
    !profilePhoto ||
    !aadhaarFront ||
    !aadhaarBack ||
    !plan ||
    !bed ||
    !phone
  ) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided" });
  }

  if (age < 18) {
    return res
      .status(400)
      .json({ error: "Tenant must be at least 18 years old" });
  }

  if (
    !profilePhoto.startsWith("data:image/") ||
    !aadhaarFront.startsWith("data:image/") ||
    !aadhaarBack.startsWith("data:image/")
  ) {
    return res.status(400).json({ error: "Images must be in Base64 format" });
  }

  next();
};

export const validatePayment = (req, res, next) => {
  const { tenant, amount, paymentFor, paymentDate } = req.body;

  if (!tenant || !amount || !paymentFor || !paymentDate) {
    return res
      .status(400)
      .json({ error: "All required payment fields must be provided" });
  }

  if (Number(amount) <= 0) {
    return res
      .status(400)
      .json({ error: "Payment amount must be greater than zero" });
  }

  next();
};
