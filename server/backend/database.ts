import path from "path";
import bcrypt from "bcryptjs";
import fs from "fs";
import { v4 } from "uuid";
import {
  uniqBy,
  sortedUniqBy,
  map,
  sample,
  reject,
  includes,
  orderBy,
  flow,
  flatMap,
  curry,
  get,
  constant,
  filter,
  inRange,
  remove,
  countBy,
  groupBy,
} from "lodash/fp";
import { isWithinInterval } from "date-fns";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import shortid from "shortid";
import {
  BankAccount,
  Transaction,
  User,
  Contact,
  TransactionStatus,
  TransactionRequestStatus,
  Like,
  Comment,
  PaymentNotification,
  PaymentNotificationStatus,
  LikeNotification,
  CommentNotification,
  NotificationType,
  NotificationPayloadType,
  NotificationsType,
  TransactionResponseItem,
  TransactionPayload,
  BankTransfer,
  BankTransferPayload,
  BankTransferType,
  NotificationResponseItem,
  TransactionQueryPayload,
  DefaultPrivacyLevel,
  Event,
  weeklyRetentionObject
} from "../../client/src/models";
import Fuse from "fuse.js";
import {
  isPayment,
  getTransferAmount,
  hasSufficientFunds,
  getChargeAmount,
  hasDateQueryFields,
  getDateQueryFields,
  hasAmountQueryFields,
  getAmountQueryFields,
  getQueryWithoutFilterFields,
  getPayAppCreditedAmount,
  isRequestTransaction,
  formatFullName,
  isLikeNotification,
  isCommentNotification,
} from "../../client/src/utils/transactionUtils";
import { DbSchema } from "../../client/src/models/db-schema";
import e from "express";
import { keys } from "lodash";
import { Filter } from './event-routes'
import { start } from "repl";


export type TDatabase = {
  users: User[];
  contacts: Contact[];
  bankaccounts: BankAccount[];
  transactions: Transaction[];
  likes: Like[];
  comments: Comment[];
  notifications: NotificationType[];
  banktransfers: BankTransfer[];
  events: Event[];
};

interface DateAndCount {
  date: string;
  count: number;
}

const USER_TABLE = "users";
const CONTACT_TABLE = "contacts";
const BANK_ACCOUNT_TABLE = "bankaccounts";
const TRANSACTION_TABLE = "transactions";
const LIKE_TABLE = "likes";
const COMMENT_TABLE = "comments";
const NOTIFICATION_TABLE = "notifications";
const BANK_TRANSFER_TABLE = "banktransfers";
const EVENT_TABLE = "events";

const databaseFile = path.join(__dirname, "../data/database.json");
const adapter = new FileSync<DbSchema>(databaseFile);

const db = low(adapter);

export const seedDatabase = () => {
  const testSeed = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "database-seed.json"), "utf-8")
  );

  // seed database with test data
  db.setState(testSeed).write();
  return;
};

export const getAllEvents = () => db.get(EVENT_TABLE).value();

export const getParseDate = (date: number) => {
  let day: string | number = new Date(+date).getDate() ;
  day = day < 10 ? '0'+day : day ;
  let month: string | number = new Date(+date).getMonth()+1 ;
  month = month < 10 ? '0'+month : month ;
  let year = new Date(+date).getFullYear() ;
  return day+'-'+month+'-'+year ;
}

export const getParseHour = (date: number) => {
  let hour: string | number = new Date(date).getHours() ;
  hour = hour < 10 ? '0'+hour : hour ;
  let minute: string | number = new Date(date).getMinutes() ;
  minute = minute < 10 ? '0'+minute : minute ;
  return hour+':00';
}
export const getSessionsByDay = () => {
 const result = db
  .get(EVENT_TABLE)
  .sortBy('date')
  .map(event=>{
    return {
      session_id: event.session_id,
      date: getParseDate(event.date)
    }
  })
  .value()
  // let temp: DateAndCount[] = [];
  // let counter ;
  // for(let i=0 ; i<result.length ; i++){
  //   let exists = temp.some((obj: DateAndCount)=>{
  //     return obj.date === result[i].date ;
  //   })
  //   if(!exists){
  //     counter = result.filter(e=>e.date===result[i].date).length;
  //     temp.push({date: result[i].date , count: counter});
  //   }
 
  // }
  // return temp;

  let temp = [];
  let temp_date = result[0].date ;
  let counter = 1 ;
  for(let i=1 ; i<result.length ; i++){
    if(result[i].date === temp_date)
      counter++;
    else {
      temp.push({date: temp_date, count: counter});
      temp_date = result[i].date;
      counter = 1;
    }
  }
  temp.push({date: temp_date, count: counter});
  return temp;
}

export const getSessionsByHour = (selectedDate: number) => {
  const result = db
    .get(EVENT_TABLE)
    .map(event=>{
      return ({
        session_id: event.session_id,
        date: getParseDate(event.date),
        hour: getParseHour(event.date)
      });
    })
    .filter(event=>{
      return event.date === getParseDate(selectedDate);
    })
    .sortBy('hour')
    .value();
    let temp = [];
    const hours = [
      '00:00','01:00','02:00','03:00','04:00',
      '05:00','06:00','07:00','08:00','09:00',
      '10:00','11:00','12:00','13:00','14:00',
      '15:00','16:00','17:00','18:00','19:00',
      '20:00','21:00','22:00','23:00'
    ];
    let hours_index = 0;
    let temp_hour = hours[hours_index];
    let counter = 0 ;

    for(let i=0 ; i < hours.length ; i++){
      counter = result.filter((event)=>event.hour===hours[i]).length ;
      temp.push({hour: hours[i] , count: counter});
    }

    // for(let i=0 ; i<result.length ; i++){
    //   if(result[i].hour === temp_hour) counter++
    //   else {
    //     temp.push({hour: temp_hour,count: counter});
    //     temp_hour = hours[++hours_index] ;
    //     counter = 0;
    //   }
    // }
    // temp.push({hour: temp_hour,count: counter});
    // while(hours_index < hours.length-1){
    //   temp_hour = hours[++hours_index] ;
    //   temp.push({hour: temp_hour,count: 0});
    // }
    return temp ;
}

export const getAllFilteredEvents = (filters: Filter) => {
  const result = db
    .get(EVENT_TABLE)
    .filter(event => {
      let isFiltered = true ;
      keys(filters).forEach((key,i)=>{
        if(isFiltered){
          if(key === "type") isFiltered = filters.type == "all" ? true : event.name == filters.type ;
          if(key === "browser") isFiltered = filters.browser == "all" ? true : event.browser == filters.browser ;
          if(key === "search"){
            isFiltered = false ;
            switch(true){
              case event._id.includes(filters.search!): 
                isFiltered = true ;
                break ;
              case event.session_id.includes(filters.search!):
                isFiltered = true ;
                break ;
              case event.name.includes(filters.search!):
                isFiltered = true ;
                break ;
              case event.url.includes(filters.search!):
                isFiltered = true ;
                break ;
              case event.distinct_user_id.includes(filters.search!):
                isFiltered = true ;
                break ;
              // case event.date.toString().includes(filters.search!):
              //   isFiltered = true ;
              //   break ;
              case event.os.includes(filters.search!):
                isFiltered = true ;
                break ;
              case event.browser.includes(filters.search!):
                isFiltered = true ;
                break ;
              
            }
          }
        }
        else return false ;
      })
      return isFiltered ;
    })
    .sortBy('date')
    .value();
  if(filters.sorting && filters.sorting[0] === '-') return result.reverse();
  else return result ;
}

export const getOneWeekDate = (start_date: number) => {
  return new Date(new Date(+start_date+6*24*60*60*1000).toDateString()).getTime();
}
export const getNextWeekDate = (start_date: number) => {

  const oneWeek: number = 7*24*60*60*1000+2*60*60*1000 ;
  const nextWeekDate: string = new Date(+start_date+oneWeek).toDateString();
  const start_next_week_date: number = new Date(nextWeekDate).getTime();
  return start_next_week_date ;

}
export const isInThisWeek = (date: number, start_date: number) => {
  let start = new Date(new Date(+start_date).toDateString()).getTime();
  let end = getNextWeekDate(start_date);
  return start < date && date < end ;
}

export const getAllSignupForWeek = (start_date: number) => {
  const signupEvents: string[] = db.get(EVENT_TABLE)
    .filter(event=>{
      return event.name == 'signup' && isInThisWeek(event.date,start_date);
    })
    .map(event=>{
      return event.distinct_user_id ;
    })
    .value();
    return signupEvents ;
}

export const getAllLoginsForWeek = (start_date: number) => {
  let loginEvents: string[] = db.get(EVENT_TABLE)
    .filter(event=>{
      return event.name == 'login' && isInThisWeek(event.date,start_date);
    })
    .map(event=>{
      return event.distinct_user_id
    })
    .value();
    return loginEvents ;
}

export const getReturnOfUsers = (rUsers: string[], lUsers: string[]) => {
  let counter = 0 ;
  for(let i=0 ; i < rUsers.length ; i++) {
    counter += lUsers.find(lUser=>lUser === rUsers[i]) ? 1 : 0 ; 
  }
  let precent = rUsers.length === 0 ? 0 : (counter / rUsers.length)*100 ;
  return Math.round(precent) ;
}

export const getWeeklyRetention = (rUsers: string[],start_date: number) => {
  let retention = [100];
  let start_week_date: number = start_date ;
  let lUsers: string[] ;
  while (getNextWeekDate(start_week_date) < new Date().getTime()) {
    lUsers = getAllLoginsForWeek(start_week_date);
    retention.push(getReturnOfUsers(rUsers,lUsers));
    start_week_date = getNextWeekDate(start_week_date);
  }
  lUsers = getAllLoginsForWeek(start_week_date);
  retention.push(getReturnOfUsers(rUsers,lUsers));
  return retention ;
}

export const getRetentionCohort = (start_date: number) => {
  let getWeeklyRetentionCohort: weeklyRetentionObject[] = [];
  let start_week_date: number = start_date ;
  let start_next_week_date: number = getNextWeekDate(start_week_date);
  let registrationWeek = 1 ;
  let rUsers: string[] ;
  while(start_next_week_date < new Date().getTime()) {
    console.log(start_week_date)
    rUsers = getAllSignupForWeek(start_week_date);
    console.log("HAPPY",rUsers);
    let obj: weeklyRetentionObject = {
        registrationWeek: registrationWeek++,
        newUsers: rUsers.length,
        weeklyRetention: getWeeklyRetention(rUsers,getNextWeekDate(start_week_date)),
        start: getParseDate(start_week_date),
        end: getParseDate(getOneWeekDate(start_week_date))
      };
    getWeeklyRetentionCohort.push(obj);
    start_week_date = start_next_week_date ;
    start_next_week_date = getNextWeekDate(start_week_date); 
  }
  rUsers = getAllSignupForWeek(start_week_date);
  let obj: weeklyRetentionObject = {
    registrationWeek: registrationWeek++,
    newUsers: rUsers.length,
    weeklyRetention: getWeeklyRetention(rUsers,getNextWeekDate(start_week_date)),
    start: getParseDate(start_week_date),
    end: getParseDate(getOneWeekDate(start_week_date))
  };
  getWeeklyRetentionCohort.push(obj);

  return getWeeklyRetentionCohort ;
}
export const addNewEvent = (Event: Event) => {
  db.get(EVENT_TABLE).push(Event).write();
}

export const getAllUsers = () => db.get(USER_TABLE).value();

export const getAllPublicTransactions = () =>
  db.get(TRANSACTION_TABLE).filter({ privacyLevel: DefaultPrivacyLevel.public }).value();

export const getAllForEntity = (entity: keyof DbSchema) => db.get(entity).value();

export const getAllBy = (entity: keyof DbSchema, key: string, value: any) => {
  const result = db
    .get(entity)
    // @ts-ignore
    .filter({ [`${key}`]: value })
    .value();

  return result;
};

export const getBy = (entity: keyof DbSchema, key: string, value: any) => {
  const result = db
    .get(entity)
    // @ts-ignore
    .find({ [`${key}`]: value })
    .value();

  return result;
};

export const getAllByObj = (entity: keyof DbSchema, query: object) => {
  const result = db
    .get(entity)
    // @ts-ignore
    .filter(query)
    .value();

  return result;
};

// Search
export const cleanSearchQuery = (query: string) => query.replace(/[^a-zA-Z0-9]/g, "");

export const setupSearch = curry((items: object[], options: {}, query: string) => {
  const fuse = new Fuse(items, options);
  return fuse.search(query);
});

export const performSearch = (items: object[], options: {}, query: string) =>
  flow(
    cleanSearchQuery,
    setupSearch(items, options),
    map((result) => result.item)
  )(query);

export const searchUsers = (query: string) => {
  const items = getAllUsers();
  return performSearch(
    items,
    {
      keys: ["firstName", "lastName", "username", "email", "phoneNumber"],
    },
    query
  ) as User[];
};

export const removeUserFromResults = (userId: User["id"], results: User[]) =>
  remove({ id: userId }, results);

// convenience methods

// User
export const getUserBy = (key: string, value: any) => getBy(USER_TABLE, key, value);
export const getUserId = (user: User): string => user.id;
export const getUserById = (id: string) => getUserBy("id", id);
export const getUserByUsername = (username: string) => getUserBy("username", username);

export const createUser = (userDetails: Partial<User>): User => {
  const password = bcrypt.hashSync(userDetails.password!, 10);
  const user: User = {
    id: shortid(),
    uuid: v4(),
    firstName: userDetails.firstName!,
    lastName: userDetails.lastName!,
    username: userDetails.username!,
    password,
    email: userDetails.email!,
    phoneNumber: userDetails.phoneNumber!,
    balance: userDetails.balance! || 0,
    avatar: userDetails.avatar!,
    defaultPrivacyLevel: userDetails.defaultPrivacyLevel!,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  saveUser(user);
  return user;
};

const saveUser = (user: User) => {
  db.get(USER_TABLE).push(user).write();
};

export const updateUserById = (userId: string, edits: Partial<User>) => {
  const user = getUserById(userId);

  db.get(USER_TABLE).find(user).assign(edits).write();
};

// Contact
export const getContactBy = (key: string, value: any) => getBy(CONTACT_TABLE, key, value);

export const getContactsBy = (key: string, value: any) => getAllBy(CONTACT_TABLE, key, value);

export const getContactsByUsername = (username: string) =>
  flow(getUserByUsername, getUserId, getContactsByUserId)(username);

export const getContactsByUserId = (userId: string): Contact[] => getContactsBy("userId", userId);

export const createContact = (contact: Contact) => {
  db.get(CONTACT_TABLE).push(contact).write();

  // manual lookup after create
  return getContactBy("id", contact.id);
};

export const removeContactById = (contactId: string) => {
  const contact = getContactBy("id", contactId);

  db.get(CONTACT_TABLE).remove(contact).write();
};

export const createContactForUser = (userId: string, contactUserId: string) => {
  const contactId = shortid();
  const contact: Contact = {
    id: contactId,
    uuid: v4(),
    userId,
    contactUserId,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  // Write contact record to the database
  const result = createContact(contact);

  return result;
};

// Bank Account
export const getBankAccountBy = (key: string, value: any) => getBy(BANK_ACCOUNT_TABLE, key, value);

export const getBankAccountById = (id: string) => getBankAccountBy("id", id);

export const getBankAccountsBy = (key: string, value: any) =>
  getAllBy(BANK_ACCOUNT_TABLE, key, value);

export const createBankAccount = (bankaccount: BankAccount) => {
  db.get(BANK_ACCOUNT_TABLE).push(bankaccount).write();

  // manual lookup after create
  return getBankAccountBy("id", bankaccount.id);
};

export const createBankAccountForUser = (userId: string, accountDetails: Partial<BankAccount>) => {
  const accountId = shortid();
  const bankaccount: BankAccount = {
    id: accountId,
    uuid: v4(),
    userId,
    bankName: accountDetails.bankName!,
    accountNumber: accountDetails.accountNumber!,
    routingNumber: accountDetails.routingNumber!,
    isDeleted: false,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  // Write bank account record to the database
  const result = createBankAccount(bankaccount);

  return result;
};

export const removeBankAccountById = (bankAccountId: string) => {
  db.get(BANK_ACCOUNT_TABLE)
    .find({ id: bankAccountId })
    .assign({ isDeleted: true }) // soft delete
    .write();
};

// Bank Transfer
// Note: Balance transfers from/to bank accounts is a future feature,
// but some of the backend database functionality is already implemented here.

/* istanbul ignore next */
export const getBankTransferBy = (key: string, value: any) =>
  getBy(BANK_TRANSFER_TABLE, key, value);

export const getBankTransfersBy = (key: string, value: any) =>
  getAllBy(BANK_TRANSFER_TABLE, key, value);

export const getBankTransfersByUserId = (userId: string) => getBankTransfersBy("userId", userId);

/* istanbul ignore next */
export const createBankTransfer = (bankTransferDetails: BankTransferPayload) => {
  const bankTransfer: BankTransfer = {
    id: shortid(),
    uuid: v4(),
    ...bankTransferDetails,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const savedBankTransfer = saveBankTransfer(bankTransfer);
  return savedBankTransfer;
};

/* istanbul ignore next */
const saveBankTransfer = (bankTransfer: BankTransfer): BankTransfer => {
  db.get(BANK_TRANSFER_TABLE).push(bankTransfer).write();

  // manual lookup after banktransfer created
  return getBankTransferBy("id", bankTransfer.id);
};

// Transaction

export const getTransactionBy = (key: string, value: any) => getBy(TRANSACTION_TABLE, key, value);

export const getTransactionById = (id: string) => getTransactionBy("id", id);

export const getTransactionsByObj = (query: object) => getAllByObj(TRANSACTION_TABLE, query);

export const getTransactionByIdForApi = (id: string) =>
  formatTransactionForApiResponse(getTransactionBy("id", id));

export const getTransactionsForUserForApi = (userId: string, query?: object) =>
  flow(getTransactionsForUserByObj(userId), formatTransactionsForApiResponse)(query);

export const getFullNameForUser = (userId: User["id"]) => flow(getUserById, formatFullName)(userId);

export const formatTransactionForApiResponse = (
  transaction: Transaction
): TransactionResponseItem => {
  const receiver = getUserById(transaction.receiverId);
  const sender = getUserById(transaction.senderId);

  const receiverName = getFullNameForUser(transaction.receiverId);
  const senderName = getFullNameForUser(transaction.senderId);
  const likes = getLikesByTransactionId(transaction.id);
  const comments = getCommentsByTransactionId(transaction.id);

  return {
    receiverName,
    senderName,
    receiverAvatar: receiver.avatar,
    senderAvatar: sender.avatar,
    likes,
    comments,
    ...transaction,
  };
};

export const formatTransactionsForApiResponse = (
  transactions: Transaction[]
): TransactionResponseItem[] =>
  orderBy(
    [(transaction: Transaction) => new Date(transaction.modifiedAt)],
    ["desc"],
    transactions.map((transaction) => formatTransactionForApiResponse(transaction))
  );

export const getAllTransactionsForUserByObj = curry((userId: string, query?: object) => {
  const queryWithoutFilterFields = query && getQueryWithoutFilterFields(query);

  const queryFields = queryWithoutFilterFields || query;

  const userTransactions = flatMap(getTransactionsByObj)([
    {
      receiverId: userId,
      ...queryFields,
    },
    {
      senderId: userId,
      ...queryFields,
    },
  ]);

  if (query && (hasDateQueryFields(query) || hasAmountQueryFields(query))) {
    const { dateRangeStart, dateRangeEnd } = getDateQueryFields(query);
    const { amountMin, amountMax } = getAmountQueryFields(query);

    return flow(
      transactionsWithinDateRange(dateRangeStart!, dateRangeEnd!),
      transactionsWithinAmountRange(amountMin!, amountMax!)
    )(userTransactions);
  }
  return userTransactions;
});

export const transactionsWithinAmountRange = curry(
  (amountMin: number, amountMax: number, transactions: Transaction[]) => {
    if (!amountMin || !amountMax) {
      return transactions;
    }

    return filter(
      (transaction: Transaction) => inRange(amountMin, amountMax, transaction.amount),
      transactions
    );
  }
);

export const transactionsWithinDateRange = curry(
  (dateRangeStart: string, dateRangeEnd: string, transactions: Transaction[]) => {
    if (!dateRangeStart || !dateRangeEnd) {
      return transactions;
    }

    return filter(
      (transaction: Transaction) =>
        isWithinInterval(new Date(transaction.createdAt), {
          start: new Date(dateRangeStart),
          end: new Date(dateRangeEnd),
        }),
      transactions
    );
  }
);

export const getTransactionsForUserByObj = curry((userId: string, query?: object) =>
  flow(getAllTransactionsForUserByObj(userId), uniqBy("id"))(query)
);

export const getContactIdsForUser = (userId: string): Contact["id"][] =>
  flow(getContactsByUserId, map("contactUserId"))(userId);

export const getTransactionsForUserContacts = (userId: string, query?: object) =>
  uniqBy(
    "id",
    flatMap(
      (contactId) => getTransactionsForUserForApi(contactId, query),
      getContactIdsForUser(userId)
    )
  );

export const getTransactionIds = (transactions: Transaction[]) => map("id", transactions);

export const getContactsTransactionIds = (userId: string): Transaction["id"][] =>
  flow(getTransactionsForUserContacts, getTransactionIds)(userId);

export const nonContactPublicTransactions = (userId: string): Transaction[] => {
  const contactsTransactionIds = getContactsTransactionIds(userId);
  return flow(
    getAllPublicTransactions,
    reject((transaction: Transaction) => includes(transaction.id, contactsTransactionIds))
  )();
};

export const getNonContactPublicTransactionsForApi = (userId: string) =>
  flow(nonContactPublicTransactions, formatTransactionsForApiResponse)(userId);

export const getPublicTransactionsDefaultSort = (userId: string) => ({
  contactsTransactions: getTransactionsForUserContacts(userId),
  publicTransactions: getNonContactPublicTransactionsForApi(userId),
});

export const getPublicTransactionsByQuery = (userId: string, query: TransactionQueryPayload) => {
  if (query && (hasDateQueryFields(query) || hasAmountQueryFields(query))) {
    const { dateRangeStart, dateRangeEnd } = getDateQueryFields(query);
    const { amountMin, amountMax } = getAmountQueryFields(query);

    return {
      contactsTransactions: getTransactionsForUserContacts(userId, query),
      publicTransactions: flow(
        transactionsWithinDateRange(dateRangeStart!, dateRangeEnd!),
        transactionsWithinAmountRange(amountMin!, amountMax!)
      )(getNonContactPublicTransactionsForApi(userId)),
    };
  } else {
    return {
      contactsTransactions: getTransactionsForUserContacts(userId),
      publicTransactions: getNonContactPublicTransactionsForApi(userId),
    };
  }
};

export const resetPayAppBalance = constant(0);

export const debitPayAppBalance = (user: User, transaction: Transaction) => {
  if (hasSufficientFunds(user, transaction)) {
    flow(getChargeAmount, savePayAppBalance(user))(user, transaction);
  } else {
    /* istanbul ignore next */
    flow(
      getTransferAmount(user),
      createBankTransferWithdrawal(user, transaction),
      resetPayAppBalance,
      savePayAppBalance(user)
    )(transaction);
  }
};

export const creditPayAppBalance = (user: User, transaction: Transaction) =>
  flow(getPayAppCreditedAmount, savePayAppBalance(user))(user, transaction);

/* istanbul ignore next */
export const createBankTransferWithdrawal = curry(
  (sender: User, transaction: Transaction, transferAmount: number) =>
    createBankTransfer({
      userId: sender.id,
      source: transaction.source,
      amount: transferAmount,
      transactionId: transaction.id,
      type: BankTransferType.withdrawal,
    })
);

export const savePayAppBalance = curry((sender: User, balance: number) =>
  updateUserById(get("id", sender), { balance })
);

export const createTransaction = (
  userId: User["id"],
  transactionType: "payment" | "request",
  transactionDetails: TransactionPayload
): Transaction => {
  const sender = getUserById(userId);
  const receiver = getUserById(transactionDetails.receiverId);
  const transaction: Transaction = {
    id: shortid(),
    uuid: v4(),
    source: transactionDetails.source,
    amount: transactionDetails.amount * 100,
    description: transactionDetails.description,
    receiverId: transactionDetails.receiverId,
    senderId: userId,
    privacyLevel: transactionDetails.privacyLevel || sender.defaultPrivacyLevel,
    status: TransactionStatus.pending,
    requestStatus: transactionType === "request" ? TransactionRequestStatus.pending : undefined,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const savedTransaction = saveTransaction(transaction);

  // if payment, debit sender's balance for payment amount
  if (isPayment(transaction)) {
    debitPayAppBalance(sender, transaction);
    creditPayAppBalance(receiver, transaction);
    updateTransactionById(transaction.id, {
      status: TransactionStatus.complete,
    });
    createPaymentNotification(
      transaction.receiverId,
      transaction.id,
      PaymentNotificationStatus.received
    );
  } else {
    createPaymentNotification(
      transaction.receiverId,
      transaction.id,
      PaymentNotificationStatus.requested
    );
  }

  return savedTransaction;
};

const saveTransaction = (transaction: Transaction): Transaction => {
  db.get(TRANSACTION_TABLE).push(transaction).write();

  // manual lookup after transaction created
  return getTransactionBy("id", transaction.id);
};

export const updateTransactionById = (transactionId: string, edits: Partial<Transaction>) => {
  const transaction = getTransactionBy("id", transactionId);
  const { senderId, receiverId } = transaction;
  const sender = getUserById(senderId);
  const receiver = getUserById(receiverId);

  // if payment, debit sender's balance for payment amount
  if (isRequestTransaction(transaction)) {
    debitPayAppBalance(receiver, transaction);
    creditPayAppBalance(sender, transaction);
    edits.status = TransactionStatus.complete;

    createPaymentNotification(
      transaction.senderId,
      transaction.id,
      PaymentNotificationStatus.received
    );
  }

  db.get(TRANSACTION_TABLE).find(transaction).assign(edits).write();
};

// Likes

export const getLikeBy = (key: string, value: any): Like => getBy(LIKE_TABLE, key, value);
export const getLikesByObj = (query: object) => getAllByObj(LIKE_TABLE, query);

export const getLikeById = (id: string): Like => getLikeBy("id", id);
export const getLikesByTransactionId = (transactionId: string) => getLikesByObj({ transactionId });

export const createLike = (userId: string, transactionId: string): Like => {
  const like = {
    id: shortid(),
    uuid: v4(),
    userId,
    transactionId,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const savedLike = saveLike(like);
  return savedLike;
};

export const createLikes = (userId: string, transactionId: string) => {
  const { senderId, receiverId } = getTransactionById(transactionId);

  const like = createLike(userId, transactionId);

  /* istanbul ignore next */
  if (userId !== senderId || userId !== receiverId) {
    createLikeNotification(senderId, transactionId, like.id);
    createLikeNotification(receiverId, transactionId, like.id);
  } else if (userId === senderId) {
    createLikeNotification(senderId, transactionId, like.id);
  } else {
    createLikeNotification(receiverId, transactionId, like.id);
  }
};

const saveLike = (like: Like): Like => {
  db.get(LIKE_TABLE).push(like).write();

  // manual lookup after like created
  return getLikeById(like.id);
};

// Comments

export const getCommentBy = (key: string, value: any): Comment => getBy(COMMENT_TABLE, key, value);
export const getCommentsByObj = (query: object) => getAllByObj(COMMENT_TABLE, query);

export const getCommentById = (id: string): Comment => getCommentBy("id", id);
export const getCommentsByTransactionId = (transactionId: string) =>
  getCommentsByObj({ transactionId });

export const createComment = (userId: string, transactionId: string, content: string): Comment => {
  const comment = {
    id: shortid(),
    uuid: v4(),
    content,
    userId,
    transactionId,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const savedComment = saveComment(comment);
  return savedComment;
};

export const createComments = (userId: string, transactionId: string, content: string) => {
  const { senderId, receiverId } = getTransactionById(transactionId);

  const comment = createComment(userId, transactionId, content);

  /* istanbul ignore next */
  if (userId !== senderId || userId !== receiverId) {
    createCommentNotification(senderId, transactionId, comment.id);
    createCommentNotification(receiverId, transactionId, comment.id);
  } else if (userId === senderId) {
    createCommentNotification(senderId, transactionId, comment.id);
  } else {
    createCommentNotification(receiverId, transactionId, comment.id);
  }
};

const saveComment = (comment: Comment): Comment => {
  db.get(COMMENT_TABLE).push(comment).write();

  // manual lookup after comment created
  return getCommentById(comment.id);
};

// Notifications

export const getNotificationBy = (key: string, value: any): NotificationType =>
  getBy(NOTIFICATION_TABLE, key, value);

export const getNotificationsByObj = (query: object): Notification[] =>
  getAllByObj(NOTIFICATION_TABLE, query);

export const getUnreadNotificationsByUserId = (userId: string) =>
  flow(getNotificationsByObj, formatNotificationsForApiResponse)({ userId, isRead: false });

export const createPaymentNotification = (
  userId: string,
  transactionId: string,
  status: PaymentNotificationStatus
): PaymentNotification => {
  const notification: PaymentNotification = {
    id: shortid(),
    uuid: v4(),
    userId: userId,
    transactionId: transactionId,
    status,
    isRead: false,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  saveNotification(notification);
  return notification;
};

export const createLikeNotification = (
  userId: string,
  transactionId: string,
  likeId: string
): LikeNotification => {
  const notification: LikeNotification = {
    id: shortid(),
    uuid: v4(),
    userId: userId,
    transactionId: transactionId,
    likeId: likeId,
    isRead: false,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  saveNotification(notification);
  return notification;
};

export const createCommentNotification = (
  userId: string,
  transactionId: string,
  commentId: string
): CommentNotification => {
  const notification: CommentNotification = {
    id: shortid(),
    uuid: v4(),
    userId: userId,
    transactionId: transactionId,
    commentId: commentId,
    isRead: false,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  saveNotification(notification);
  return notification;
};

const saveNotification = (notification: NotificationType) => {
  db.get(NOTIFICATION_TABLE).push(notification).write();
};

export const createNotifications = (userId: string, notifications: NotificationPayloadType[]) =>
  notifications.flatMap((item: NotificationPayloadType) => {
    if ("status" in item && item.type === NotificationsType.payment) {
      return createPaymentNotification(userId, item.transactionId, item.status);
    } else if ("likeId" in item && item.type === NotificationsType.like) {
      return createLikeNotification(userId, item.transactionId, item.likeId);
    } else {
      /* istanbul ignore next */
      if ("commentId" in item) {
        return createCommentNotification(userId, item.transactionId, item.commentId);
      }
    }
  });

export const updateNotificationById = (
  userId: string,
  notificationId: string,
  edits: Partial<NotificationType>
) => {
  const notification = getNotificationBy("id", notificationId);

  db.get(NOTIFICATION_TABLE).find(notification).assign(edits).write();
};

export const formatNotificationForApiResponse = (
  notification: NotificationType
): NotificationResponseItem => {
  let userFullName = getFullNameForUser(notification.userId);
  const transaction = getTransactionById(notification.transactionId);

  if (isRequestTransaction(transaction)) {
    userFullName = getFullNameForUser(transaction.senderId);
  }

  if (isLikeNotification(notification)) {
    const like = getLikeById(notification.likeId);
    userFullName = getFullNameForUser(like.userId);
  }

  if (isCommentNotification(notification)) {
    const comment = getCommentById(notification.commentId);
    userFullName = getFullNameForUser(comment.userId);
  }

  return {
    userFullName,
    ...notification,
  };
};

export const formatNotificationsForApiResponse = (
  notifications: NotificationResponseItem[]
): NotificationResponseItem[] =>
  orderBy(
    [(notification: NotificationResponseItem) => new Date(notification.modifiedAt)],
    ["desc"],
    notifications.map((notification) => formatNotificationForApiResponse(notification))
  );

// dev/test private methods
/* istanbul ignore next */
export const getRandomUser = () => {
  const users = getAllUsers();
  return sample(users)!;
};

/* istanbul ignore next */
export const getAllContacts = () => db.get(CONTACT_TABLE).value();

/* istanbul ignore next */
export const getAllTransactions = () => db.get(TRANSACTION_TABLE).value();

/* istanbul ignore */
export const getBankAccountsByUserId = (userId: string) => getBankAccountsBy("userId", userId);

/* istanbul ignore next */
export const getNotificationById = (id: string): NotificationType => getNotificationBy("id", id);

/* istanbul ignore next */
export const getNotificationsByUserId = (userId: string) => getNotificationsByObj({ userId });

/* istanbul ignore next */
export const getBankTransferByTransactionId = (transactionId: string) =>
  getBankTransferBy("transactionId", transactionId);

/* istanbul ignore next */
export const getTransactionsBy = (key: string, value: string) =>
  getAllBy(TRANSACTION_TABLE, key, value);

/* istanbul ignore next */
export const getTransactionsByUserId = (userId: string) => getTransactionsBy("receiverId", userId);


export default db;
