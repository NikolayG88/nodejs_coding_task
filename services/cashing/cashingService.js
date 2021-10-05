import { MAX_TRANSACTION_AMOUNT, MIN_TRANSACTION_AMOUNT, TRANSACTION_CASH_IN, TRANSACTION_CASH_OUT, USER_TYPE_JURIDICAL, USER_TYPE_NATURAL } from './constants.js';

import HttpService from '../http/httpService.js';
import UtilityService from '../utility/utilityService.js';

class CashingService {
  constructor() {
    this.httpService = new HttpService();
    this.util = new UtilityService();
    this.cashIn = null;
    this.cashOutNaturalTransactionCache = [];
    this.cashOutNatural = null;
    this.cashOutJuridical = null;
  }

  cacheCashOutTransaction(transaction) {
    this.cashOutNaturalTransactionCache.push(transaction);
  }

  async preloadTransactionOptions() {
    this.cashIn = await this.httpService.GetRequest('cash-in');
    this.cashOutNatural = await this.httpService.GetRequest('cash-out-natural');
    this.cashOutJuridical = await this.httpService.GetRequest('cash-out-juridical');
  }

  async makeTransaction(transaction) {
    if (!this.cashIn
      || !this.cashOutNatural
      || !this.cashOutJuridical) await this.preloadTransactionOptions();

    let result = null;
    switch (transaction.type) {
      case TRANSACTION_CASH_IN: {
        return this.doCashIn(transaction, this.cashIn);
      }
      case TRANSACTION_CASH_OUT: {
        return this.doCashOut(transaction, this.cashOutNatural, this.cashOutJuridical);
      }
      default:
        break;
    }

    return result;
  }

  calcCashInFee(cashInfee, amount) {
    const fee = amount * (cashInfee.percents / 100) > cashInfee.max.amount
      ? cashInfee.max.amount
      : amount * (cashInfee.percents / 100);

    const total = amount - fee;

    return {
      fee: fee,
      total: total
    }
  }

  weeklyLimitReached(transactionArr, cashOutFeeNatural, transaction) {
    const monday = this.util.getMondayDayOfYear(transaction.date);
    const sunday = this.util.getSundayDayOfYear(transaction.date);
    const amount = transaction.operation.amount;

    // get transactions for the week
    const weeklyTotals = transactionArr
      .filter(t => {
        const tranDay = this.util.toDayOfYear(new Date(t.date));
        // Take all weekly cash out transactions
        return monday <= tranDay && tranDay <= sunday;
      })
      .map(t => t.operation.amount);
    // calculate weekly transaction amt
    const weeklyAmt = (weeklyTotals.length ? weeklyTotals.reduce((prev, curr) => prev + curr) : 0);

    // if less than weekly max no fee
    if (weeklyAmt >= cashOutFeeNatural.week_limit.amount)
      return {
        reached: true,
        amtToCharge: amount
      };

    if (weeklyAmt + amount > cashOutFeeNatural.week_limit.amount)
      return {
        reached: true,
        amtToCharge: amount + weeklyAmt - cashOutFeeNatural.week_limit.amount
      }

    return {
      reached: false,
      amtToCharge: amount
    }
  }

  calcCashOutFeeNatural(transaction, cashOutFeeNatural) {
    let fee = 0;
    let total = 0;

    const userTransactions = this.cashOutNaturalTransactionCache.filter(t => t.user_id === transaction.user_id);
    const res = this.weeklyLimitReached(userTransactions, cashOutFeeNatural, transaction);

    // if less than weekly max no fee
    if (res.reached) {
      fee = res.amtToCharge * (cashOutFeeNatural.percents / 100);
      total = transaction.operation.amount - fee;
    } else {
      total = transaction.operation.amount;
    }

    return {
      fee: fee,
      total: total
    }
  }

  calcCashOutFeeLegal(transaction, cashOutFeeLegal) {

    let fee = transaction.operation.amount * (cashOutFeeLegal.percents / 100);

    if (fee < cashOutFeeLegal.min.amount) fee = 0.5;

    return {
      fee: fee,
      total: transaction.operation.amount - fee
    }
  }

  doCashIn(transaction, cashIn) {
    if (transaction.operation.amount < MIN_TRANSACTION_AMOUNT) throw Error('Minimum transaction amount exceeded!');
    if (transaction.operation.amount > MAX_TRANSACTION_AMOUNT) throw Error('Max transaction amount exceeded!');

    const res = this.calcCashInFee(cashIn, transaction.operation.amount);
    return {
      fee: this.util.roundCurrency(res.fee),
      total: this.util.roundCurrency(res.total)
    };
  }

  doCashOut(transaction, cashOutNatural, cashOutJuridical) {
    if (transaction.operation.amount < MIN_TRANSACTION_AMOUNT) throw Error('Minimum transaction amount exceeded!');
    if (transaction.operation.amount > MAX_TRANSACTION_AMOUNT) throw Error('Max transaction amount exceeded!');

    switch (transaction.user_type) {
      case USER_TYPE_NATURAL: {
        return this.doCashOutNatural(transaction, cashOutNatural);
      }
      case USER_TYPE_JURIDICAL: {
        return this.doCashOutJuridical(transaction, cashOutJuridical);
      }
      default:
        return;
    }
  }

  doCashOutJuridical(transaction, cashOutJuridical) {
    const res = this.calcCashOutFeeLegal(transaction, cashOutJuridical);
    return {
      fee: this.util.roundCurrency(res.fee),
      total: this.util.roundCurrency(res.total)
    };
  }

  doCashOutNatural(transaction, cashOutNatural) {
    const res = this.calcCashOutFeeNatural(transaction, cashOutNatural);
    this.cashOutNaturalTransactionCache.push(transaction);

    return {
      fee: this.util.roundCurrency(res.fee),
      total: this.util.roundCurrency(res.total)
    };
  }
}

export default CashingService;
