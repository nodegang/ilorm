/* eslint-disable */

const { expect, } = require('chai');
const { MongoClient, ObjectID, } = require('mongodb');
const ilorm = require('ilorm');

const ilormMongo = require('../index');

ilorm.use(ilormMongo);

const DB_URL = 'mongodb://localhost:27017/ilorm';

describe('ilorm-connector-mongodb', () => {
  describe('test/referenceQuery', () => {

    let mongoClient;
    let database;
    let newModelParams;

    before(async () => {

      mongoClient = await MongoClient.connect(DB_URL);
      database = await mongoClient.db('ilorm');

      const { Schema, } = ilorm;

      const userSchema = new Schema({
        firstName: Schema.string().required(),
        lastName: Schema.string().required(),
        gender: Schema.string().required()
      });

      const invoiceSchema = new Schema({
        user: Schema.reference('users').required(),
        amount: Schema.number().required(),
      });

      const MongoConnector = ilormMongo.fromClient(database);

      newModelParams = {
        users: {
          name: 'users',
          schema: userSchema,
          connector: new MongoConnector({
            collectionName: 'users',
          }),
        },
        invoices: {
          name: 'invoices',
          schema: invoiceSchema,
          connector: new MongoConnector({
            collectionName: 'invoices',
          }),
        },
      };

      const benjaminId = new ObjectID();
      const kathyId = new ObjectID();
      const paulineId = new ObjectID();

      await database.collection('users').insertMany([
        {
          firstName: 'Guillaume',
          lastName: 'Daix',
          gender: 'M'
        }, {
          _id: kathyId,
          firstName: 'Kathy',
          lastName: 'Pen-flame',
          gender: 'F'
        }, {
          _id: paulineId,
          firstName: 'Pauline',
          lastName: 'Pen-flame',
          gender: 'F'
        }, {
          _id: benjaminId,
          firstName: 'Benjamin',
          lastName: 'Martin',
          gender: 'M'
        }
      ]);

      await database.collection('invoices').insertMany([
        {
          user: benjaminId,
          amount: 400
        },
        {
          user: kathyId,
          amount: 400
        },
        {
          user: kathyId,
          amount: 55
        },
        {
          user: paulineId,
          amount: 55
        }
      ]);
    });

    after(async () => {
      await database.dropCollection('users');
      await database.dropCollection('invoices');

      await mongoClient.close();
    });

    it('Could query invoice', async() => {
      class User extends ilorm.newModel(newModelParams.users) {}
      class Invoice extends ilorm.newModel(newModelParams.invoices) {}

      ilorm.declareModel(User);
      ilorm.declareModel(Invoice);

      const userQuery = User.query()
        .firstName.is('Benjamin');

      const invoice = await Invoice.query()
        .linkedWith(userQuery)
        .findOne();

      expect(invoice.amount).to.be.equal(400);
    });

    it('Could query only Kathy with criteria from two query', async() => {

      class User extends ilorm.newModel(newModelParams.users) {}
      class Invoice extends ilorm.newModel(newModelParams.invoices) {}

      ilorm.declareModel(User);
      ilorm.declareModel(Invoice);

      const invoiceQuery = Invoice.query()
        .amount.is(400);

      const users = await User.query()
        .linkedWith(invoiceQuery)
        .gender.is('F')
        .find();

      expect(users.length).to.be.equal(1);
      expect(users[0].firstName).to.be.equal('Kathy');
    });

    it('Could stream data from the database', async() => {


      class User extends ilorm.newModel(newModelParams.users) {}
      class Invoice extends ilorm.newModel(newModelParams.invoices) {}

      ilorm.declareModel(User);
      ilorm.declareModel(Invoice);

      const userQuery = User.query()
        .gender.is('F');

      let totalInvoice = 0;

      const invoiceStream =(await Invoice.query()
        .linkedWith(userQuery)
        .stream());

      invoiceStream.on('data', invoice => totalInvoice += invoice.amount);

      await new Promise(function (resolve) {
        invoiceStream.on('finish', () => {
          resolve();
        })
      });
      expect(totalInvoice).to.be.equal(510);
    });

  });
});




