let blog = {
  findAll: (req, res) => {
    res.json({ message: "blog get request" });
  },
  findById: (req, res) => {
    res.json({ message: "blog get by id request" });
  },
  create: (req, res) => {
      
  },
};

module.exports = blog;
