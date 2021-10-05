import fs from 'fs';

class UtilityService {
  readFile(fPath) {
    return new Promise((resolve) => {
      fs.readFile(fPath, 'utf8', function (err, data) {
        if (err) throw err;
        resolve(data.toString());
      });
    })
  }

  // Get first day of current week
  getMonday(root) {
    const date = new Date(root);
    var day = date.getDay(),
      diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  }

  getSunday(root) {
    const monday = this.getMonday(root);
    return new Date(monday.setDate(monday.getDate() + 6));
  }

  getMondayDayOfYear(root) {
    const monday = this.getMonday(root);
    return this.toDayOfYear(monday);
  }

  getSundayDayOfYear(root) {
    const monday = this.getMonday(root);
    const sunday = this.getSunday(monday);
    return this.toDayOfYear(sunday);
  }

  // Extracts out the day of the year 1-366 from a given date
  toDayOfYear(root) {
    var start = new Date(root.getFullYear(), 0, 0);
    var diff = root - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);

    return day;
  }

  roundCurrency(amount) {
    return Math.ceil(amount * 100) / 100
  }
}

export default UtilityService;
