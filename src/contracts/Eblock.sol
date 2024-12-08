// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Eblock {
    string public name;

    uint public productCount = 0;
    mapping(uint => Product) public products; // map an uint id to the Product datatype and store it as products
    // due to limitation of the EVM, it's impossible to know the number of Product(s) in the mapping, products
    // so it returns empty struct Product when one prompt for nonexisting product or id, hence the productCount

    struct Product { // creates a new custom datatype called Product
        uint id;
        string name;
        uint price;
        address payable owner;
        bool purchased;
    }

    event productCreated (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    event productPurchased (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    constructor() public {
        name = "The Eblock Marketplace";
    }

    function createProduct(string memory _name, uint _price) public {
        // requires a valid name
        require(bytes(_name).length > 0);
        // requires a valid price
        require(_price > 0);
        // product count increment
        productCount ++;
        // create the product
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);
        // trigger an event
        emit productCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint _id) public payable {
        // fetch the product
        Product memory _product = products[_id]; // using "memory" to create a copy "_product" of the Product struct
        // fetch the seller
        address payable _seller = _product.owner;
        // make sure that product as a valid id
        require(_product.id > 0 && _product.id <= productCount);
        // make sure there is enough Ether in the transaction
        require(msg.value >= _product.price);
        // make sure the product as not been purchased already
        require(!_product.purchased);
        // make sure the seller can NOT be the buyer
        require(_seller != msg.sender);
        // purchase product: transfer ownership to the sender
        _product.owner = msg.sender;
        // mark product as purchased
        _product.purchased = true;
        // update the product
        products[_id] = _product;
        // pay the seller
        address(_seller).transfer(msg.value);
        // trigger an event
        emit productPurchased(productCount, _product.name, _product.price, msg.sender, _product.purchased);
    }

}