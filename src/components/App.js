import React, { Component } from 'react';
import Web3 from 'web3';
import Eblock from '../abis/Eblock.json';
import './App.css';
import Navbar from './Navbar';
import Main from './Main';

class App extends Component {
  async componentDidMount() {
    await this.loadWeb3();
    await this.loadAccount();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      // await window.ethereum.enable();
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async loadAccount() {
    const web3 = window.web3; // Access the Web3 instance
    const accounts = await web3.eth.getAccounts(); // Correct method name
    // console.log(accounts);
    this.setState({ account: accounts[0] }) // set account in the props state

    const networkId = await web3.eth.net.getId()
    console.log(networkId)
    const networkData = Eblock.networks[networkId]

    if (networkData) {
      const eblock = new web3.eth.Contract(Eblock.abi, networkData.address)
      this.setState({ eblock }) // explicitly: this.setState({ eblock: eblock })
      this.setState({ loading: false })
      const productCount = await eblock.methods.productCount().call()
      console.log(productCount.toString())
      this.setState({ productCount })

      // load products
      let updatedProducts = [...this.state.products]; // Start with the current state

      for (var i = 1; i <= productCount; i++) {
        const product = await eblock.methods.products(i).call()
        // this.setState({ // setState asynchronous issue, not updating immediately
        //   products: [...this.state.products, product]
        // })
        updatedProducts.push(product); // Update the temporary array
        this.setState({ products: updatedProducts }); // Update React state

        console.log(product)
        // console.log(updatedProducts)
      }

      console.log(this.state.products)
      this.setState({ loading: false })
    } else {
      window.alert("Eblock contract not deployed to detected network")
    }
  }

  // set state variable to allow inside the render function
  constructor(props) {
    super(props)
    this.state = {
      account: "",
      productCount: 0,
      products: [],
      loading: true
    }

    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }

  createProduct(name, price) {
    this.setState({ loading: true })
    this.state.eblock.methods.createProduct(name, price).send({ from: this.state.account }) // creates the product here
      .once("receipt", (receipt) => { // receipt return by the blockchain
        this.setState({ loading: false })
      })
  }

  purchaseProduct(id, price) {
    this.setState({ loading: true })
    this.state.eblock.methods.purchaseProduct(id).send({ from: this.state.account, value: price }) // creates the product here
      .once("receipt", (receipt) => { // receipt return by the blockchain
        this.setState({ loading: false })
      })
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="role">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading
                ? <div id='loader' className='text-center'><p className='text-center'>Loading...</p></div>
                : <Main
                  createProduct = {this.createProduct}
                  products = {this.state.products}
                  purchaseProduct = {this.purchaseProduct}
                />
              }
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
