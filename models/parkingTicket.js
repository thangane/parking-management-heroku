class ParkingTicket {
    constructor(id, vehicleType, vehicleNumber, entryTime, exitTime, parkingAmount, couponId, couponCode, discountedAmount, netAmount, allotedFloorId, allotedFloorName) {
        this.id = id;
        this.vehicleType = vehicleType;
        this.vehicleNumber = vehicleNumber;
        this.entryTime = entryTime;
        this.exitTime = exitTime;
        this.parkingAmount = parkingAmount;
        this.couponId = couponId;
        this.couponCode = couponCode;
        this.discountedAmount = discountedAmount;
        this.netAmount = netAmount;
        this.allotedFloorId = allotedFloorId;
        this.allotedFloorName = allotedFloorName;
    }
}
module.exports = ParkingTicket;