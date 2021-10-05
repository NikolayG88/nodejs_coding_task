import regeneratorRuntime from "regenerator-runtime";

import CashingService from './cashingService.js';
import { EUR, TRANSACTION_CASH_IN, TRANSACTION_CASH_OUT, USER_TYPE_JURIDICAL, USER_TYPE_NATURAL } from "./constants.js";

let cashInFee = {
  percents: 0.03,
  max: {
    amount: 5,
    currency: EUR
  }
};

let cashOutNatural = {
  percents: 0.3,
  week_limit: {
    amount: 1000,
    currency: EUR
  }
};

let cashOutJuridical = {
  percents: 0.3,
  min: {
    amount: 0.5,
    currency: EUR
  }
};

let cashingService;
beforeAll(() => {
  cashingService = new CashingService();
});

test('calc cash in fee less than max', async () => {
  const amount = 10;
  const result = cashingService.calcCashInFee(cashInFee, amount);
  // No rounding for the calculation itself, rounding is made on the do methods
  expect(result).toStrictEqual({
    fee: 0.0029999999999999996,
    total: 9.997
  });
});

test('do cash in fee less than max', async () => {
  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_IN,
    operation: {
      amount: 100
    },
    date: Date()
  };

  const result = cashingService.doCashIn(transaction, cashInFee);

  expect(result).toStrictEqual({
    fee: 0.03,
    total: 99.97
  });
});

test('calc cash in fee grater than max', async () => {
  const amount = 50000;
  const result = cashingService.calcCashInFee(cashInFee, amount);

  expect(result).toStrictEqual({
    fee: 5,
    total: 49995
  });
});

test('do cash in fee grater than max', async () => {
  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_IN,
    operation: {
      amount: 50000
    },
    date: Date()
  };

  const result = cashingService.doCashIn(transaction, cashInFee);

  expect(result).toStrictEqual({
    fee: 5,
    total: 49995
  });
});

test('calc cash out fee natural within weekly limit', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transactions = [{
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 100
    },
    date: Date()
  },
  {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 105
    },
    date: Date()
  },
  {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 20
    },
    date: Date()
  }];

  for (const transaction of transactions) {
    cashingService.doCashOutNatural(transaction, cashOutNatural);
  };

  const res = cashingService.doCashOutNatural({
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 100
    },
  }, cashOutNatural);

  expect(res).toStrictEqual({
    fee: 0,
    total: 100
  });
});

test('calc cash out fee natural weekly limit reached', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transactions = [{
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 500
    },
    date: Date()
  },
  {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 400
    },
    date: Date()
  }
  ];

  for (const transaction of transactions) {
    cashingService.doCashOutNatural(transaction, cashOutNatural);
  }

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 100
    },
    date: Date()
  };

  const res = cashingService.doCashOutNatural(transaction, cashOutNatural);

  expect(res).toStrictEqual({
    fee: 0,
    total: 100
  });
});

test('calc cash out fee natural weekly limit exceeded', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transactions = [{
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 500
    },
    date: Date()
  },
  {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 600
    },
    date: Date()
  }
  ];

  for (const transaction of transactions) {
    cashingService.doCashOutNatural(transaction, cashOutNatural);
  }

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 100
    },
    date: Date()
  };

  const res = cashingService.doCashOutNatural(transaction, cashOutNatural);

  expect(res).toStrictEqual({
    fee: 0.3,
    total: 99.7
  });
});

test('calc cash out fee natural weekly limit exceeded partial charge amount', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transactions = [{
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 500
    },
    date: Date()
  },
  {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 400
    },
    date: Date()
  }
  ];

  for (const transaction of transactions) {
    cashingService.doCashOutNatural(transaction, cashOutNatural);
  }

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 200
    },
    date: Date()
  };

  const res = cashingService.doCashOutNatural(transaction, cashOutNatural);

  expect(res).toStrictEqual({
    fee: 0.3,
    total: 199.7
  });
});

test('calc cash out fee legal above min', async () => {
  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_JURIDICAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 1000
    },
    date: Date()
  };

  const res = cashingService.calcCashOutFeeLegal(transaction, cashOutJuridical);
  expect(res).toStrictEqual({
    fee: 3,
    total: 997
  });
});

test('calc cash out fee legal below min', async () => {
  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_JURIDICAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 100
    },
    date: Date()
  };

  const res = cashingService.calcCashOutFeeLegal(transaction, cashOutJuridical);
  expect(res).toStrictEqual({
    fee: 0.5,
    total: 99.5
  });
});

test('doCashOut transaction natural', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 100
    },
    date: Date()
  };

  const res = cashingService.doCashOut(transaction, cashOutNatural, cashOutJuridical);
  expect(res).toStrictEqual({
    fee: 0,
    total: 100
  });
  expect(cashingService.cashOutNaturalTransactionCache.length).toStrictEqual(1);
});

test('doCashOut transaction juridical', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_JURIDICAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 100
    },
    date: Date()
  };

  const res = cashingService.doCashOut(transaction, cashOutNatural, cashOutJuridical);
  expect(res).toStrictEqual({
    fee: 0.5,
    total: 99.5
  });

  expect(cashingService.cashOutNaturalTransactionCache.length).toBe(0);
});


// Negative tests
test('do cash in MAX transaction amount exceeded', async () => {
  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_JURIDICAL,
    type: TRANSACTION_CASH_IN,
    operation: {
      amount: 1000001
    },
    date: Date()
  };

  expect(() => {
    cashingService.doCashIn(transaction, cashInFee);
  }).toThrow('Max transaction amount exceeded!');
});

test('do cash in MIN transaction amount exceeded', async () => {
  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_JURIDICAL,
    type: TRANSACTION_CASH_IN,
    operation: {
      amount: 0.001
    },
    date: Date()
  };

  expect(() => {
    cashingService.doCashIn(transaction, cashInFee);
  }).toThrow('Minimum transaction amount exceeded!');
});

test('do cash in transaction juridical MAX amount exceeded', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_JURIDICAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 1000001
    },
    date: Date()
  };

  expect(() => {
    cashingService.doCashOut(transaction, cashOutNatural, cashOutJuridical);
  }).toThrow('Max transaction amount exceeded!');
});

test('do cash in transaction natural MAX amount exceeded', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 1000001
    },
    date: Date()
  };

  expect(() => {
    cashingService.doCashOut(transaction, cashOutNatural, cashOutJuridical);
  }).toThrow('Max transaction amount exceeded!');
});

test('do cash in transaction juridical MIN amount exceeded', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_JURIDICAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 0.001
    },
    date: Date()
  };

  expect(() => {
    cashingService.doCashOut(transaction, cashOutNatural, cashOutJuridical);
  }).toThrow('Minimum transaction amount exceeded!');
});

test('do cash in transaction natural MIN amount exceeded', async () => {
  cashingService.cashOutNaturalTransactionCache = [];

  const transaction = {
    user_id: 1,
    user_type: USER_TYPE_NATURAL,
    type: TRANSACTION_CASH_OUT,
    operation: {
      amount: 0.001
    },
    date: Date()
  };

  expect(() => {
    cashingService.doCashOut(transaction, cashOutNatural, cashOutJuridical);
  }).toThrow('Minimum transaction amount exceeded!');
});