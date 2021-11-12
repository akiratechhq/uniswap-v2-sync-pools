import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { BigNumber, Contract } from 'ethers';
import { formatUnits, namehash, parseUnits } from "ethers/lib/utils";

import UniswapV2Factory from "../buildV2/UniswapV2Factory.json";
import UniswapV2Pair from "../buildV2/UniswapV2Pair.json";

const { deployContract } = waffle;

const { MaxUint256 } = ethers.constants;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const overrides = {
  gasLimit: 9999999
}

describe("Uniswap Factory", function () {
  let owner, ownerAddress;
  let alice, aliceAddress;
  let bob, bobAddress;
  let carl, carlAddress;
  let token0, token1;
  let WETH;

  it("Should deploy factory", async function () {
    [owner, alice, bob, carl] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carlAddress = await carl.getAddress();

    const WETHFactory = await ethers.getContractFactory("WETH9");
    WETH = await WETHFactory.deploy();
    await WETH.deployed();

    const TokenContract = await ethers.getContractFactory("ERC20Mock");

    token0 = await TokenContract.deploy("Token 0", "TK0", ownerAddress, parseUnits("10000").toString());
    await token0.deployed();
    token1 = await TokenContract.deploy("Token 1", "TK1", ownerAddress, parseUnits("10000").toString());
    await token1.deployed();

    console.log(`\t WETH: ${WETH.address}`);
    console.log(`\t token0: ${token0.address}`);
    console.log(`\t token1: ${token1.address}`);

    const uniFactory = await deployContract(owner, UniswapV2Factory, [ZERO_ADDRESS]);
    expect(await uniFactory.feeToSetter()).to.equal(ZERO_ADDRESS);

    const RouterV2Factory = await ethers.getContractFactory("UniswapV2Router02");
    const router = await RouterV2Factory.deploy(uniFactory.address, WETH.address);
    await router.deployed();
    await uniFactory.createPair(token0.address, token1.address);

    const pairAddress = await uniFactory.getPair(token0.address, token1.address);
    console.log('\t pairAddress', pairAddress);
    const pair = await ethers.getContractAt(UniswapV2Pair.abi, pairAddress);

    await token0.approve(router.address, MaxUint256);
    await token1.approve(router.address, MaxUint256);
    await router.addLiquidity(
      token0.address,
      token1.address,
      10000,
      10000,
      0,
      0,
      aliceAddress,
      MaxUint256,
      overrides
    )
    // const path = [token0.address, token1.address]
    // // expect(await router.getAmountsIn(BigNumber.from(1), path)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)])
    // console.log(`\t LP Tokens Alice balance: ${await pair.balanceOf(aliceAddress)}`);

    // await router.swapExactTokensForTokens(
    //   BigNumber.from(50),
    //   0,
    //   path,
    //   ownerAddress,
    //   MaxUint256,
    // );

    // await router.addLiquidity(
    //   token0.address,
    //   token1.address,
    //   BigNumber.from(10000),
    //   BigNumber.from(10000),
    //   0,
    //   0,
    //   bobAddress,
    //   MaxUint256,
    //   overrides
    // )

    // const lpTokensBob = await pair.balanceOf(bobAddress);
    // console.log(`\t LP Tokens Bob balance: ${lpTokensBob}`);

    // await pair.connect(bob).approve(router.address, MaxUint256);
    // await router.connect(bob).removeLiquidity(
    //   token0.address,
    //   token1.address,
    //   BigNumber.from(9000),
    //   0,
    //   0,
    //   bobAddress,
    //   MaxUint256,
    //   overrides
    // );

    // console.log(`\t Bob token0.balanceOf: ${await token0.balanceOf(bobAddress)}`);
    // console.log(`\t Bob token1.balanceOf: ${await token1.balanceOf(bobAddress)}`);


  });
});
