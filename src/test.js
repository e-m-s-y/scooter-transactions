const Crypto = require("@arkecosystem/crypto");
const ScooterRegistrationBuilder = require("./builders/scooter-registration-builder");
const RentalStartBuilder = require("./builders/rental-start-builder");
const RentalFinishBuilder = require("./builders/rental-finish-builder");
const ScooterRegistrationTransaction = require("./transactions/scooter-registration-transaction");
const RentalStartTransaction = require("./transactions/rental-start-transaction");
const RentalFinishTransaction = require("./transactions/rental-finish-transaction");
const TransactionBuilder = Crypto.Transactions.BuilderFactory.transfer().instance();
const childProcess = require('child_process');
const config = require("./bridgechain-config");
const args = require("./args");
const nonce = args.nonce || '1';
const passphrase_scooter = '';
const passphrase_rider = '';
const address_scooter = '';
const address_rider = '';

console.log('\n---------- ARGS ----------');
console.log(args);

// https://api.radians.nl/api/v2/node/configuration/crypto
Crypto.Managers.configManager.setConfig(config);

Crypto.Transactions.TransactionRegistry.registerTransactionType(ScooterRegistrationTransaction);
Crypto.Transactions.TransactionRegistry.registerTransactionType(RentalStartTransaction);
Crypto.Transactions.TransactionRegistry.registerTransactionType(RentalFinishTransaction);

let transactions = [];

if(args.txt === 'sr') {
	transactions.push(ScooterRegistrationBuilder.scooterId('1234567890')
		.nonce(nonce)
		.sign(passphrase_scooter));
} else if(args.txt === 'rs') {
	transactions.push(RentalStartBuilder.sessionId(Crypto.Crypto.HashAlgorithms.sha256('hello').toString('hex'))
	//transactions.push(RentalStartBuilder.sessionId('1234300000000000000000000000000000000000000000000000000000000000')
		.gps(Date.now(), '1.111111', '-180.222222')
		.rate('5')
		.amount('60')  //this determines the ride length(1 minute)
		.recipientId(address_scooter)
		.nonce(nonce)
		.vendorField(args.vf)
		.sign(passphrase_rider));
} else if(args.txt === 'rf') {
	transactions.push(RentalFinishBuilder.sessionId(Crypto.Crypto.HashAlgorithms.sha256('hello').toString('hex'))
		.gps(Date.now(), '10.111111', '-20.222222')
		.gps(Date.now() + 90 * 1000, '15.111111', '-25.222222')
		.amount('1')
		.recipientId(address_rider)
		.containsRefund(true)
		.nonce(nonce)
		.vendorField(args.vf)
		.fee('1')
		.sign(passphrase_scooter));
} else if(args.txt === 't') {
	transactions.push(TransactionBuilder.amount('1')
		.version(2)
		.recipientId(address_scooter)
		.vendorField(args.vf)
		.nonce(nonce)
		.fee('1')
		.sign(passphrase_scooter));
}

let payload = {
	transactions: []
};

for(const transaction of transactions) {
	payload.transactions.push(transaction.getStruct());

	if(args.d) {
		let serialized = transaction.build().serialized.toString('hex');
		let deserialized = Crypto.Transactions.Deserializer.deserialize(serialized);

		console.log(`\nTransaction is verified: ${transaction.verify()}`);
		console.log(`\nSerialized: ${serialized}`);
		console.log('\nDeserialized: %O', deserialized);
	}
}

console.log('\n---------- COMMAND ----------');
	
const command = 'curl --request POST --url https://api.radians.nl/api/transactions ' +
	'--header "content-type:application/json" --data ' + JSON.stringify(JSON.stringify(payload));

console.log(command);

if(!args.d) {
	console.log('\n---------- RESPONSE ----------');
	console.log(childProcess.execSync(command).toString('UTF8'));
}


