const express = require("express")
const router = express.Router();

const busBookingController = require("../controllers/busBooking")

router.get("/getSeatLayout/:id", busBookingController.getSeatLayoutController);
router.post("/getVrlBusDetails", busBookingController.getVrlBusDetailsController); 

router.get("/getSrsSchedules/:origin_id/:destination_id/:travel_date", busBookingController.getSrsSchedulesController);
router.get("/getSrsSeatDetails/:schedule_id", busBookingController.getSrsSeatDetailsController);

module.exports=router;
