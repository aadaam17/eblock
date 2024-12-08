import "core-js/stable";
import "regenerator-runtime/runtime";

// require("chai")
//     .use(require("chai-as-promised"))
//     .should();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

// import chai from "chai";
// import chaiAsPromised from "chai-as-promised";

// chai.use(chaiAsPromised);
// chai.should();

const Eblock = artifacts.require("./Eblock.sol");

contract("Eblock", ([deployer, seller, buyer]) => {
    let eblock;

    before(async () => {
        eblock = await Eblock.deployed(); // get deployed copy of smart contract
    })

    describe("deployment", async () => {
        it("deploys successfully", async () => {
            const address = await eblock.address;

            assert.notEqual(address, "0x0")
            assert.notEqual(address, "")
            assert.notEqual(address, "null")
            assert.notEqual(address, "undefined")
        })

        it("has a name", async () => {
            const name = await eblock.name();

            assert.equal(name, "The Eblock Marketplace")
        })
    })

    describe("product", async () => {
        let result, productCount;
        before(async () => {
            result = await eblock.createProduct("Laptop", web3.utils.toWei("1", "Ether"), { from: seller }); // 1 Ether = 1000000000000000000
            productCount = await eblock.productCount()
        })

        it("creates products", async () => {
            const event = result.logs[0].args
            // Success
            assert.equal(productCount, 1)
            assert.equal(event.id.toNumber(), productCount.toNumber(), "id is correct")
            assert.equal(event.name, "Laptop", "name is correct")
            assert.equal(event.price, 1000000000000000000, "price is correct")
            assert.equal(event.owner, seller, "owner is correct")
            assert.equal(event.purchased, false, "purchase  is correct")

            // Failure: product must have a name
            await await eblock.createProduct("", web3.utils.toWei("1", "Ether"), { from: seller}).should.be.rejected;
            // Failure: product must have a price
            await await eblock.createProduct("Laptop", 0, { from: seller}).should.be.rejected;

        })

        it("list products", async () => {
            
            const product = await eblock.products(productCount);
            assert.equal(product.name, "Laptop", "name is correct")
            assert.equal(product.id.toNumber(), productCount.toNumber(), "id is correct")
            assert.equal(product.price, 1000000000000000000, "price is correct")
            assert.equal(product.owner, seller, "owner is correct")
            assert.equal(product.purchased, false, "purchase  is correct")

        })

        it("sell products", async () => {
            // track seller balance before purchase
            let oldSellerBalance;
            oldSellerBalance = await web3.eth.getBalance(seller);
            oldSellerBalance = new web3.utils.BN(oldSellerBalance);

            result = await eblock.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei("1", "Ether")});

            const event = result.logs[0].args
            // logs
            assert.equal(event.id.toNumber(), productCount.toNumber(), "id is correct")
            assert.equal(event.name, "Laptop", "name is correct")
            assert.equal(event.price, 1000000000000000000, "price is correct")
            assert.equal(event.owner, buyer, "owner is correct")
            assert.equal(event.purchased, true, "purchase  is correct")

            // track new seller balance after purchase
            let newSellerBalance;
            newSellerBalance = await web3.eth.getBalance(seller);
            newSellerBalance = new web3.utils.BN(newSellerBalance);

            let price;
            price = web3.utils.toWei("1", "Ether");
            price = new web3.utils.BN(price);

            const expectedBalance = oldSellerBalance.add(price);
            assert.equal(newSellerBalance.toString(), expectedBalance.toString(), "Balance is correct")

            // failure: product must have a valid id
            await eblock.purchaseProduct(99, { from: buyer, value: web3.utils.toWei("1", "Ether")}).should.be.rejected;
            // failure: purchase with not enough Ether
            await eblock.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei("0.5", "Ether")}).should.be.rejected;
            // failure: deployer tries to buy the same product, i.e product can NOT be purchased twice
            await eblock.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei("1", "Ether")}).should.be.rejected;
            // failure: buyer tries to buy the same product again, i.e buyer can't be seller
            await eblock.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei("1", "Ether")}).should.be.rejected;
        })
    })

})