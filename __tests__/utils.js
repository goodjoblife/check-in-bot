const moment = require("moment");
const utils = require("../utils");

describe("#getYearMonthDateForTimeZone", () => {
  it("should return year, month, date", async () => {
    const date = new Date("2018-01-20T18:32:34Z");

    expect(utils.getYearMonthDateForTimeZone(date)).toEqual({
      year: 2018,
      month: 0, // month count from 0
      date: 20,
    });
  });

  it("should return year, month, date for specific timezone", async () => {
    const date = new Date("2018-01-20T18:32:34Z");

    expect(utils.getYearMonthDateForTimeZone(date, +8)).toEqual({
      year: 2018,
      month: 0,
      date: 21,
    });

    const date2 = moment("2018-01-20T16:32:34Z").utcOffset(7);

    expect(utils.getYearMonthDateForTimeZone(date2, +8)).toEqual({
      year: 2018,
      month: 0,
      date: 21,
    });
  });
});
