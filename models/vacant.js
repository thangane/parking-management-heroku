class Vacant {
    constructor(id, name, totalSpaces, carSpace, bikeSpace, busSpace, vacantCarSpace, vacantBikeSpace, vacantBusSpace, createdAt) {
        this.id = id;
        this.name = name;
        this.totalSpaces = totalSpaces;
        this.carSpace = carSpace;
        this.bikeSpace = bikeSpace;
        this.busSpace = busSpace;
        this.vacantCarSpace = vacantCarSpace;
        this.vacantBikeSpace = vacantBikeSpace;
        this.vacantBusSpace = vacantBusSpace;
        this.createdAt = createdAt;
    }
}
module.exports = Vacant;