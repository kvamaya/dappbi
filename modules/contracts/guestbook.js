var private = {}, self = null,
	library = null, modules = null;

function guestbook(cb, _library) {
	self = this;
	self.type = 6
	library = _library;
	cb(null, self);
}

var aliasedFields = [
	{ field: "t.id", alias: "id" },
	{ field: "t.blockId", alias: "blockId" },
	{ field: "t.senderId", alias: "senderId" },
	{ field: "t.recipientId", alias: "recipientId" },
	{ field: "t.amount", alias: "amount" },
	{ field: "t.fee", alias: "fee" },
	{ field: "t.timestamp", alias: "timestamp" },
	{ field: "entry", alias: "entry" },
	{ field: "uniqueID", alias: "uniqueID" },
	{ field: "fio", alias: "fio" },
	{ field: "passport", alias: "passport" },
	{ field: "durationFrom", alias: "durationFrom" },
	{ field: "durationTo", alias: "durationTo" },
	{ field: "price", alias: "price" },
];

var fieldMap = {
	"id": String,
	"blockId": String,
	"senderId": String,
	"recipientId": String,
	"amount": Number,
	"fee": Number,
	"timestamp": Date,
	"entry": String,
	"uniqueID" : String,
	"fio": String,
	"passport": String,
	"durationFrom": String,
	"durationTo": String,
	"price": String
};

guestbook.prototype.create = function (data, trs) {
	trs.recipientId = data.recipientId;
	trs.asset = {
		entry: new Buffer(data.entry, 'utf8').toString('hex'),
		fio: new Buffer(data.fio, 'utf8').toString('hex'),
		passport: new Buffer(data.passport, 'utf8').toString('hex'),
		uniqueID: new Buffer(data.uniqueID, 'utf8').toString('hex'),
		durationFrom: new Buffer(data.durationFrom, 'utf8').toString('hex'),
		durationTo: new Buffer(data.durationTo, 'utf8').toString('hex'),
		price: new Buffer(data.price, 'utf8').toString('hex')
	};

	return trs;
}

guestbook.prototype.calculateFee = function (trs) {
    return 0; // Free!
}

guestbook.prototype.verify = function (trs, sender, cb, scope) {
	if (trs.asset.entry.length > 2000) {
		return setImmediate(cb, "Max length of an entry is 1000 characters!");
	}

	setImmediate(cb, null, trs);
}

guestbook.prototype.getBytes = function (trs) {
	return new Buffer(trs.asset.entry, 'hex');
//return new Buffer(trs.asset, 'hex');
}

guestbook.prototype.apply = function (trs, sender, cb, scope) {
    modules.blockchain.accounts.mergeAccountAndGet({
        address: sender.address,
        balance: -trs.fee
    }, cb);
}

guestbook.prototype.undo = function (trs, sender, cb, scope) {
    modules.blockchain.accounts.undoMerging({
        address: sender.address,
        balance: -trs.fee
    }, cb);
}

guestbook.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
    if (sender.u_balance < trs.fee) {
        return setImmediate(cb, "Sender doesn't have enough coins");
    }

    modules.blockchain.accounts.mergeAccountAndGet({
        address: sender.address,
        u_balance: -trs.fee
    }, cb);
}

guestbook.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
    modules.blockchain.accounts.undoMerging({
        address: sender.address,
        u_balance: -trs.fee
    }, cb);
}

guestbook.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

guestbook.prototype.save = function (trs, cb) {
	modules.api.sql.insert({
		table: "asset_entries",
		values: {
			transactionId: trs.id,
			entry: trs.asset.entry,
			fio: trs.asset.fio,
			passport: trs.asset.passport,
			uniqueID: trs.asset.uniqueID,
			durationFrom: trs.asset.durationFrom,
            durationTo: trs.asset.durationTo,
            price: trs.asset.price
		}
	}, cb);
}

guestbook.prototype.dbRead = function (row) {
	if (!row.gb_transactionId) {
		return null;
	} else {
		return {
			entry: row.gb_entry
		};
	}
}

guestbook.prototype.normalize = function (asset, cb) {
	library.validator.validate(asset, {
		type: "object", // It is an object
		properties: {
			entry: { // It contains a entry property
				type: "string", 
				format: "hex", 
				minLength: 1 
			},
			fio: { 
				type: "string", 
				format: "hex", 
				minLength: 0 
			},
			passport: { 
				type: "string", 
				format: "hex", 
				minLength: 0 
			},
			uniqueID: { 
				type: "string", 
				format: "hex", 
				minLength: 0 
			},
			durationFrom: { 
				type: "string", 
				format: "hex", 
				minLength: 0 
			},
			durationTo: { 
				type: "string", 
				format: "hex", 
				minLength: 0 
			},
			price: { 
				type: "string", 
				format: "hex", 
				minLength: 0 
			}
		},
		required: ["entry"] // Entry property is required and must be defined
	}, cb);
}

guestbook.prototype.onBind = function (_modules) {
	modules = _modules;
	modules.logic.transaction.attachAssetType(self.type, self);
}

guestbook.prototype.add = function (cb, query) {
			console.log('addfunction');	
			console.log('fio:' + query.fio);
			console.log('passport:' + query.passport);
			console.log('uniqueid:' + query.uniqueID);
			console.log('durationfrom:' + query.durationFrom);
			console.log('durationto:' + query.durationTo);
			console.log('price:' + query.price);
			console.log('secret:' + query.secret);

library.validator.validate(query, {
		type: "object",
		properties: {
			recipientId: {
				type: "string",
				minLength: 1,
				maxLength: 21
			},
			secret: {
				type: "string",
				minLength: 1,
				maxLength: 100
			},
			entry: {
				type: "string",
				minLength: 1,
				maxLength: 1000
			},
			fio: {
				type: "string",
				minLength: 0,
				maxLength: 200
			},
			passport: {
				type: "string",
				minLength: 0,
				maxLength: 50
			},
			uniqueID: {
				type: "string",
				minLength: 0,
				maxLength: 20
			},			
			durationFrom: {
				type: "string",
				minLength: 0,
				maxLength: 100
			},
			durationTo: {
				type: "string",
				minLength: 0,
				maxLength: 100
			},
			price: {
				type: "string",
				minLength: 0,
				maxLength: 50
			}
		}
	}, function (err) {
		// If error exists, execute callback with error as first argument
		if (err) {
			console.log('error in validating');
			return cb(err[0].message);
		}

		var keypair = modules.api.crypto.keypair(query.secret);

		modules.blockchain.accounts.setAccountAndGet({
			publicKey: keypair.publicKey.toString('hex')
		}, function (err, account) {
			// If error occurs, call cb with error argument
			if (err) {
				return cb(err);
			}

			try {
				var transaction = library.modules.logic.transaction.create({
					type: self.type,
					entry: query.entry,
					recipientId: query.recipientId,
					sender: account,
					fio: query.fio,
					passport: query.passport,
					uniqueID: query.uniqueID,
					durationFrom: query.durationFrom,
					durationTo: query.durationTo,
					price: query.price,
					keypair: keypair
				});
			} catch (e) {
				// Catch error if something goes wrong
				console.log('error creating transaction');
				return setImmediate(cb, e.toString());
			}
			
console.log(transaction);
			// Send transaction for processing
			modules.blockchain.transactions.processUnconfirmedTransaction(transaction, cb);
		});
	});
}

guestbook.prototype.list = function (cb, query) {
    // Verify query parameters
    library.validator.validate(query, {
        type: "object",
        properties: {
            recipientId: {
                type: "string",
                minLength: 2,
                maxLength: 21
            }
        },
        required: ["recipientId"]
    }, function (err) {
        if (err) {
            return cb(err[0].message);
        }

        // Select from transactions table and join entries from the asset_entries table
        modules.api.sql.select({
            table: "transactions",
            fields: aliasedFields,
            alias: "t",
            condition: {
                recipientId: query.recipientId,
                type: self.type
            },
            join: [{
                type: 'left outer',
                table: 'asset_entries',
                alias: "gb",
                on: {"t.\"id\"": "gb.\"transactionId\""}
            }]
        }, fieldMap, function (err, transactions) {
            if (err) {
                return cb(err.toString());
            }

            // Map results to asset object
            var entries = transactions.map(function (tx) {
                tx.asset = {
                    entry: new Buffer(tx.entry, 'hex').toString('utf8'),
                    fio: new Buffer(tx.fio, 'hex').toString('utf8'),
                    passport: new Buffer(tx.passport, 'hex').toString('utf8'),
                    uniqueID: new Buffer(tx.uniqueID, 'hex').toString('utf8'),
                    durationFrom: new Buffer(tx.durationFrom, 'hex').toString('utf8'),
                    durationTo: new Buffer(tx.durationTo, 'hex').toString('utf8'),
                    price: new Buffer(tx.price, 'hex').toString('utf8')
                };
                console.log(tx.asset);
                delete tx.entry;
                delete tx.fio;
                delete tx.passport;
                delete tx.uniqueID;
                delete tx.durationFrom;
                delete tx.durationTo;
                delete tx.price;
                
                return tx;
            });

            return cb(null, {
                entries: entries
            })
        });
    });
}

module.exports = guestbook;
