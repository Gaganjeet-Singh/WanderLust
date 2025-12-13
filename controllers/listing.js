
const Listing = require("../models/listing");

module.exports.index = async(req,res) => {
    const allListing = await Listing.find({});
    res.render("listings/index.ejs",{allListing});
};

module.exports.renderNewForm = (req,res) => {
    console.log(req.user);
    
    res.render("listings/new.ejs");
};

module.exports.showListings = async (req, res) => {
    const { id } = req.params;

    const list = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!list) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings"); // ✅ STOP execution
    }

    res.render("listings/show.ejs", { list });
};


module.exports.createListing= async(req,res,next) => {
        let url = req.file.path;
        let filename = req.file.filename;
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {url,filename};
        await newListing.save();
        req.flash("success","New Listing Created!")
        res.redirect("/listings");
   
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  
  if (!listing) {
    req.flash("error", "Listing you request for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image?.url;
  if (originalImageUrl) {
    originalImageUrl = originalImageUrl.replace(
      "/upload",
      "/upload/h_300,w_250/"
    );
  }
  console.log(originalImageUrl);
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};


module.exports.updateListing = async(req,res) => {
    
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error","You don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }
    let lisitng = await Listing.findByIdAndUpdate(id,{...req.body.listing});

    if(typeof req.file != "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
        await listing.save();
    }
    req.flash("success","Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res) => {
    let {id} = req.params;
    const deletelist = await Listing.findByIdAndDelete(id);
    console.log(deletelist);
    req.flash("success","Listing Deleted!")
    res.redirect("/listings");
};