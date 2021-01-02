// @flow
import passwordHash from 'password-hash';
import TransactionModel from '../Model/TransactionModel';
import UserModel from '../Model/UserModel';
import Logger from '../Logger';

export async function deleteUser(userId: number, force: boolean = false) {
  const user = await getUser(userId);
  if (!force && user.get('credit') !== 0) {
    throw new Error('Cannot delete User unless 0 credit');
  }
  await user.destroy();
}

export async function updateToken(userId: number, newToken: string): Promise<UserModel> {
  const user = await UserModel.where({
    id: userId,
  }).fetch();
  if (user) {
    return user.save({
      token: newToken,
    });
  }
  throw new Error('User not Found');
}

export function getAllUsers() {
  return UserModel.fetchAll({
    columns: ['id', 'name', 'lastchanged', 'credit', 'avatar', knex.raw('pincode NOT NULL as isPinProtected')],
  });
}

export async function userHasPin(userId: number) {
  const user = await getUser(userId);
  return user.get('pincode') != null;
}

export async function checkUserPin(userId: number, pincode: string) {
  const user = await UserModel.where({ id: userId }).fetch();
  if (!user) {
    Logger.error(`Couldn't check PIN for user ${userId}`);
    throw new Error(`Couldn't check PIN for user ${userId}`);
  }

  const dbPin = user.get('pincode');
  const dbToken = user.get('token');

  if ((dbPin != null && !passwordHash.verify(pincode, dbPin)) || (dbToken != null && dbToken === pincode)) {
    throw new Error('Wrong Pin');
  }
}

export async function addUser(username: string) {
  if (!username.trim()) {
    throw new Error('Please enter a name');
  }
  const existingUser = await UserModel.where({ name: username }).fetch({ require: false });
  if (existingUser) {
    Logger.error(`Couldn't save user ${username}, already exists`);
    throw new Error('User exists already.');
  }
  const user = await new UserModel({
    credit: 0,
    debtAllowed: true,
    lastchanged: new Date(),
    name: username,
  }).save(null, { method: 'insert' });
  //Logger.info(`[addUser] New user ${username} created`);

  return user;
}

export async function updateCredit(user: User, delta: number, description: string): Promise<UserModel> {
  user.credit += Number(delta);
  user.credit = Math.round(user.credit * 100) / 100;
  user.lastchanged = new Date();

  const transaction = new TransactionModel({
    userId: user.id,
    delta,
    credit: user.credit,
    time: new Date(),
    description,
  });
  await transaction.save(null, { method: 'insert' });

  let dbUser = await UserModel.where({ id: user.id }).fetch();
  if (!dbUser) {
    Logger.error(`Couldn't save transaction for user ${user.name}`);
    throw new Error(`failed to update Credit for user ${user.name}`);
  }
  dbUser = await dbUser.save({ credit: user.credit, lastchanged: new Date() });

  Logger.info(`[userCredit] Changed credit from user ${user.name} by ${delta}. New credit: ${user.credit}`);

  return dbUser;
}

export function getUserTransactions(userId: number) {
  return TransactionModel.where({
    // eslint-disable-next-line
    user_id: userId,
  }).fetchAll();
}

export async function getUserTransactionsAsQIF(userId: number) {
  const transactions = await getUserTransactions(userId);
  let qif = "!Type:Bank\n";
  for (let i in transactions.models) {
    const t = transactions.models[i].serialize();
    qif = qif.concat(
      `D${new Date(t.time).toLocaleDateString()}\n`,
      `T${t.delta}\n`,
      `M${t.description}\n`,
      `PFnordcredit\n`,
      "^\n"
    );
  }
  return qif;
}

export async function getUserByToken(token: string) {
  const user = await UserModel.where({
    token,
  }).fetch();
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

export async function getUser(userId: number) {
  const user = await UserModel.where({
    id: userId,
  }).fetch();
  if (!user) {
    throw new Error('User not found');
  }
  return user.attributes;
}

export async function renameUser(
  user: User,
  newname: string // rawPincode?: string,
) {
  // let pincode;
  // if (rawPincode) {
  //   pincode = passwordHash.generate(rawPincode);
  // }

  const dbUser = await UserModel.where({
    id: user.id,
  }).fetch();
  if (!dbUser) {
    Logger.error(`Couldn't save user ${newname}`);
    throw new Error('Couldnt rename user');
  }
  if (dbUser.get('name') === newname) {
    throw new Error('Failed to rename to same name');
  }
  const existingUserByName = await UserModel.where({
    name: newname,
  }).fetch({ require: false });
  if (existingUserByName) {
    Logger.error(`Couldn't save user ${newname}, username already exists`);
    throw new Error('Username exists already.');
  }
  await dbUser.save({
    name: newname,
  });
  return dbUser;
}

export async function updatePin(userId: number, newPincode: string) {
  const user = await getUser(userId);
  let hashedPincode = null;

  if (newPincode) {
    hashedPincode = passwordHash.generate(newPincode);
  }
  await user.save({ pincode: hashedPincode });
}

export async function updateAvatar(userId: number, url: string) {
  const user = await getUser(userId);
  await user.save({ avatar: url });
  return user;
}
