import CashingService from './services/cashing/cashingService.js';
import UtilityService from './services/utility/utilityService.js';

const args = process.argv.slice(2);

(async () => {
  try {
    const util = new UtilityService();
    const cashingService = new CashingService();

    const dataJson = await util.readFile(args[0]);
    for(const transaction of JSON.parse(dataJson)) {
      const res = await cashingService.makeTransaction(transaction);
       console.log(res.fee.toFixed(2));
    };
  } catch (err) {
    console.error(err);
  }
})();
