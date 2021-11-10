class Coupon {
    constructor(id, code, startAt, endAt, used, invalidated) {
        this.id = id;
        this.code = code;
        this.startAt = startAt;
        this.endAt = endAt;
        this.used = used;
        this.invalidated = invalidated;
    }
}
module.exports = Coupon;