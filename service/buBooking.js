const axios = require("axios");
const OAuth = require("oauth-1.0a");
const crypto = require('crypto');
const VrlCity = require("../modals/vrlcities.js");
const SrsCity = require("../modals/srscities.js");
const { stages } = require("../utils/stages.js");

const capitalizeFirstLetter = (str) => {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};
// const sendRequest = async (url, method, data) => {
//   try {
//     const oauth = OAuth({
//       consumer: {
//         key: process.env.CUSTOMER_KEY,
//         secret: process.env.CUSTOMER_SECRET,
//       },
//       signature_method: 'HMAC-SHA1',
//       hash_function(base_string, key) {
//         return crypto.createHmac('sha1', key).update(base_string).digest('base64');
//       },
//     });

//     const requestData = {
//       url: url,
//       method: method,
//       data: data,
//     };

//     const headers = oauth.toHeader(oauth.authorize(requestData));

//     const response = await axios({
//       method: method,
//       url: url,
//       headers: headers,
//       data: data,
//     });

//     return response.data;

//   } catch (error) {
//     console.log(error);
//     throw error.message;
//   }
// };

// vrl travels buses
const sendVrlRequest = async (url, data) => {
  try {
    data.verifyCall = process.env.VERIFY_CALL;
    const response = await axios({
      method: "POST",
      url: `https://itsplatform.itspl.net/api/${url}`,
      data: data,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.message;
  }
};


exports.getVrlBusDetails = async (searchArgs, filters) => {
  try {
    if (filters.busPartners && filters.busPartners.every(partner => partner.trim() !== "VRL Travels")) {
      return {
        status: 200,
        data: [],
      };
    }

    const [vrlSourceCity, vrlDesctinationCity] = await Promise.all([
      VrlCity.findOne({ CityName: capitalizeFirstLetter(searchArgs.sourceCity) }),
      VrlCity.findOne({ CityName: capitalizeFirstLetter(searchArgs.destinationCity) }),
    ]);

    const dateParts = searchArgs.doj.split('-');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    const requestBody = {
      fromID: parseInt(vrlSourceCity.CityID),
      toID: parseInt(vrlDesctinationCity.CityID),
      journeyDate: formattedDate.toString(),
    }

    let searchResponse = await sendVrlRequest("GetAvailableRoutes", requestBody);
    searchResponse = searchResponse.data.AllRouteBusLists;
    searchResponse = searchResponse.map((route) => {
      route.type = "vrl";
      const prices = [
        route.AcSeatRate - route.AcSeatServiceTax - route.AcSeatSurcharges,
        route.AcSleeperRate - route.AcSlpServiceTax - route.AcSlpSurcharges,
        route.AcSlumberRate - route.AcSlmbServiceTax - route.AcSlmbSurcharges,
        route.NonAcSeatRate - route.NonAcSeatServiceTax - route.NonAcSeatSurcharges,
        route.NonAcSleeperRate - route.NonAcSlpServiceTax - route.NonAcSlpSurcharges,
        route.NonAcSlumberRate - route.NonAcSlmbServiceTax - route.NonAcSlmbSurcharges,
      ];
      const validPrices = prices.filter(price => price > 0);
      const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

      route.lowestPrice = lowestPrice;
      route.allPrices = [...new Set(validPrices)];
      return route;
    })

    if (!hasFilters(filters)) {
      return {
        status: 200,
        data: searchResponse,
      };
    }

    const filteredBuses = searchResponse.filter(route => {

      const hasMatchingBoardingPoint = filters.boardingPoints ? route.BoardingPoints?.split('#').some(point => {
        const location = point.split('|')[1];
        return filters.boardingPoints?.some(filterPoint => filterPoint.trim() === location.trim());
      })
        : true;

      const hasMatchingDroppingPoint = filters.droppingPoints ? route.DroppingPoints?.split('#').some(point => {
        const location = point.split('|')[1];
        return filters.droppingPoints?.some(filterPoint => filterPoint === location);
      })
        : true;

      return hasMatchingBoardingPoint && hasMatchingDroppingPoint;
    });

    if (filters.maxPrice || filters.minPrice) {
      const filteredByPrice = filteredBuses.filter(route => {
        const routePrices = route.allPrices || [];
        const validPricesInRange = routePrices.filter(price =>
          (!filters.minPrice || price >= filters.minPrice) &&
          (!filters.maxPrice || price <= filters.maxPrice)
        );

        return validPricesInRange.length > 0;
      });

      return {
        status: 200,
        data: filteredByPrice,
        sourceCity: vrlSourceCity.CityID,
        destinationCity: vrlDesctinationCity.CityID,
      };
    } else {
      return {
        status: 200,
        data: filteredBuses,
        sourceCity: vrlSourceCity.CityID,
        destinationCity: vrlDesctinationCity.CityID,
      };
    }
  } catch (error) {
    throw error.message;
  }
};




// srs buses APIS
const sendSrsRequest = async (url, method, data) => {
  try {
    const headers = {
      'api-key': process.env.SRS_API_KEY,
      'Content-Type': 'application/json',
      'Accept-Encoding': 'application/gzip',
    };
    const response = await axios({
      method: method,
      //test
      // url: `http://gds-stg.ticketsimply.co.in/${url}`,

      //live
      url: `https://gds.ticketsimply.com/${url}`,

      headers: headers,
      data: data,
    });

    return response;
  } catch (error) {
    throw error.message;
  }
};

 
exports.getSrsSchedules = async (origin_id, destination_id, travel_date) => {
  const [srsSourceCity, srsDesctinationCity] = await Promise.all([
    SrsCity.findOne({ name: capitalizeFirstLetter(origin_id) }),
    SrsCity.findOne({ name: capitalizeFirstLetter(destination_id) }),
  ]);
  const url = `/gds/api/schedules/${srsSourceCity.id}/${srsDesctinationCity.id}/${travel_date}.json`;
  const response = await sendSrsRequest(url, "GET");
  console.log(response)
  const key = response.data.result[0];
  let resultArray = response.data.result?.slice(1).map(row => { 
    const obj = {};
    key.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  resultArray = resultArray.map(bus => {
    bus.boarding_stages = bus.boarding_stages?.split(',').map(item => {
      const [stage, time] = item.split('|');
      return stages[stage];
    });

    bus.dropoff_stages = bus.dropoff_stages?.split(',').map(item => {
      const [stage, time] = item.split('|');
      return stages[stage];
    });
    bus.type = "srs";
    return bus;
  });

  resultArray = resultArray.reduce((acc, bus) => {
    if (bus.operator_service_name.toLowerCase().startsWith('srs')) {
      acc.unshift(bus);
    } else {
      acc.push(bus);
    }
    return acc;
  }, []);

  return resultArray;
};

exports.getSrsSeatDetails = async (schedule_id) => {
  const url = `/gds/api/schedule/${schedule_id}.json`;
  const response = await sendSrsRequest(url, "GET");
  return response.data;
};