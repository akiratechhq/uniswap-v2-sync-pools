import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { BigNumber } from 'ethers';
import { formatUnits, namehash, parseUnits } from "ethers/lib/utils";

// import UniswapV2Factory from "../build/UniswapV2Factory.json";

const { deployContract } = waffle;

const { MaxUint256 } = ethers.constants;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
// console.log(parseUnits("3").toString());

describe("Uniswap Factory", function () {
  let owner;
  let user1;
  let token0;
  let token1;
  let WETH;

  it("Should deploy factory", async function () {
    [owner, user1] = await ethers.getSigners();
    const ownerAddress = await owner.getAddress();
    console.log(`ownerAddress: ${ownerAddress}`);

    const RouterV2Factory = await ethers.getContractFactory("UniswapV2Router02");

    console.log("fetching WETHFactory");
    const WETHFactory = await ethers.getContractFactory("WETH9", owner);
    console.log("fetched WETHFactory");
    WETH = await WETHFactory.deploy();
    await WETH.deployed();
    console.log("WETH deployed");

    console.log("fetching ERC20Mock");
    const TokenContract = await ethers.getContractFactory("ERC20Mock");
    console.log("ERC20Mock fetched");



    token0 = await TokenContract.deploy("Token 0", "TK0", ownerAddress, "10000");
    await token0.deployed();
    token1 = await TokenContract.deploy("Token 1", "TK1", ownerAddress, "10000");
    await token1.deployed();


    console.log(`token0: ${token0.address}`);
    console.log(`token1: ${token1.address}`);
    console.log(`WETH: ${WETH.address}`);

    // const UniFactory = await ethers.getContractFactory("UniswapV2Factory");
    // const uniFactory = await UniFactory.deploy(ZERO_ADDRESS);
    // await uniFactory.deployed();
    // const uniFactory = await deployContract(owner, UniswapV2Factory, [owner.address]);



    // const uniFactory = await deployContract(owner, UniswapV2Factory, [ZERO_ADDRESS]);
    // expect(await uniFactory.feeToSetter()).to.equal(ZERO_ADDRESS);

    // const RouterV2Factory = await ethers.getContractFactory("UniswapV2Router02");
    // const router = await RouterV2Factory.deploy(uniFactory.address, WETH.address);
    // await router.deployed();
    // // const pair = await uniFactory.createPair(token0.address, token1.address);
    // // console.log(pair);
    // await token0.approve(router.address, MaxUint256)
    // await token1.approve(router.address, MaxUint256)

    // const pairAddress = await uniFactory.getPair(token0.address, token1.address);
    // console.log('pairAddress', pairAddress);

    // console.log(`pair address: ${pairAddress}`);
  });
});
