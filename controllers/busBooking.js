const {
    getSeatLayout,
    getVrlBusDetails,
    getSrsSchedules,
    getSrsSeatDetails,
  } = require("../service/buBooking.js");
  
 exports.getSeatLayoutController = async (req, res) => {
    try {
      const response = await getSeatLayout(req.params.id);
      res.status(200).send(response);
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        status: 500,
        message: "An error occurred while getting seat layout",
        error: error,
      });
    }
  };
 
 exports.getVrlBusDetailsController = async (req, res) => {
    try {
      const searchArgs = {
        sourceCity: req.body.sourceCity,
        destinationCity: req.body.destinationCity,
        doj: req.body.doj,
      };
      let filters = {};
      if (
        req.body.boardingPoints !== null &&
        req.body.boardingPoints?.length > 0
      ) {
        filters.boardingPoints = req.body.boardingPoints;
      }
      if (
        req.body.droppingPoints !== null &&
        req.body.droppingPoints?.length > 0
      ) {
        filters.droppingPoints = req.body.droppingPoints;
      }
      if (req.body.busPartners !== null && req.body.busPartners?.length > 0) {
        filters.busPartners = req.body.busPartners;
      }
      if (req.body.minPrice !== null && req.body.minPrice !== undefined) {
        filters.minPrice = req.body.minPrice;
      }
      if (req.body.maxPrice !== null && req.body.maxPrice !== undefined) {
        filters.maxPrice = req.body.maxPrice;
      }
      const response = await getVrlBusDetails(searchArgs, filters);
      res.status(response.status).send(response);
    } catch (error) {
      // console.log(error);
      return res.status(500).send({
        status: 500,
        message: "An error occurred while getting bus details with filters",
      });
    }
  };
  
  //vrl travels buses
  
 exports.getSrsSchedulesController = async (req, res) => {
    try {
      const { origin_id, destination_id, travel_date } = req.params;
      const response = await getSrsSchedules(
        origin_id,
        destination_id,
        travel_date
      );
      res.status(200).send(response);
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        status: 500,
        message: "Internal Server Error",
        error: error,
      });
    }
  };
  
 exports.getSrsSeatDetailsController = async (req, res) => {
    try {
      const { schedule_id } = req.params;
      const response = await getSrsSeatDetails(schedule_id);
      res.status(200).send(response);
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        status: 500,
        message: "Internal Server Error", 
        error: error,
      });
    }
  };