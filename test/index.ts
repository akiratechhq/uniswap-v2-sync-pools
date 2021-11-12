import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { BigNumber, BigNumberish, Contract } from 'ethers';
import { formatUnits, namehash, parseUnits } from "ethers/lib/utils";

import UniswapV2Factory from "../buildV2/UniswapV2Factory.json";
import UniswapV2Pair from "../buildV2/UniswapV2Pair.json";
import { ERC20Mock, UniswapV2Router02 } from "../typechain";

const { deployContract } = waffle;

const { MaxUint256 } = ethers.constants;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const overrides = {
  gasLimit: 9999999
}

const showReserves = async (pair: Contract) => {
  await pair.sync();
  const [reserve0, reserve1] = await pair.getReserves();
  console.log(`\t Reserve0: ${reserve0} | Reserve1: ${reserve1} | K value: ${reserve0 * reserve1}`);
}


describe("Uniswap Factory", function () {
  let owner, ownerAddress;
  let alice, aliceAddress;
  let bob, bobAddress;
  let carl, carlAddress;
  let token0: ERC20Mock, token1: ERC20Mock;
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

    console.log("\n");

    const addLiquidity = async (t0Amount: BigNumberish, t1Amount: BigNumberish, toAddress: string): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        amountA: BigNumber;
        amountB: BigNumber;
        liquidity: BigNumber;
      }
    > => {
      // NB: first use callStatic: simulates the call as a view only one
      // returns the values from the chain
      const rt = await router.callStatic.addLiquidity(
        token0.address,
        token1.address,
        t0Amount,
        t1Amount,
        0,
        0,
        toAddress,
        MaxUint256,
        overrides
      );

      await router.addLiquidity(
        token0.address,
        token1.address,
        t0Amount,
        t1Amount,
        0,
        0,
        toAddress,
        MaxUint256,
        overrides
      );

      console.log(`\t addLiquidity: amount0: ${rt[0]} | amount1: ${rt[1]} | LP Tokens: ${rt[2]}`);

      return rt;
    }


    // NB: if getting reverted with reason string 'ds-math-sub-underflow'
    // it means that you need to add more liquidity
    // see UniswapV2Pair.MINIMUM_LIQUIDITY and mint()
    const aliceAddLiqTkn0 = 4000;
    const aliceAddLiqTkn1 = 2000;
    console.log(`\t Alice addLiquidity Tkn0: ${aliceAddLiqTkn0}; Tkn1: ${aliceAddLiqTkn1}`);
    await addLiquidity(
      aliceAddLiqTkn0,
      aliceAddLiqTkn1,
      aliceAddress,
    );
    const path = [token0.address, token1.address]
    // // expect(await router.getAmountsIn(BigNumber.from(1), path)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)])
    await showReserves(pair);

    // NB using callStatic: simulates the call as a view only one
    // returns the values from the chain
    const tokenASwapAmount = 100;
    const [swapAmount0, swapAmount1] = await router.callStatic.swapExactTokensForTokens(
      tokenASwapAmount,
      0,
      path,
      ownerAddress,
      MaxUint256,
    );
    console.log("\n");
    console.log(`\t Swapped ${swapAmount0.toString()} Token A into ${swapAmount1} Token B`);
    // the actual call happens here
    await router.swapExactTokensForTokens(
      tokenASwapAmount,
      0,
      path,
      ownerAddress,
      MaxUint256,
    );

    await showReserves(pair);

    console.log("\n");
    const bobAddLiqTkn0 = 4000;
    const bobAddLiqTkn1 = 2000;
    console.log(`\t Bob addLiquidity Tkn0: ${bobAddLiqTkn0}; Tkn1: ${bobAddLiqTkn1}`);
    await addLiquidity(
      bobAddLiqTkn0,
      bobAddLiqTkn1,
      bobAddress
    );

    const lpTokensBob = await pair.balanceOf(bobAddress);
    console.log(`\t LP Tokens Bob balance: ${lpTokensBob}`);
    await showReserves(pair);

    console.log("\n");
    const carlAddLiqTkn0 = 4000;
    const carlAddLiqTkn1 = 2000;
    console.log(`\t Carl addLiquidity Tkn0: ${carlAddLiqTkn0}; Tkn1: ${carlAddLiqTkn1}`);
    await addLiquidity(
      carlAddLiqTkn0,
      carlAddLiqTkn1,
      carlAddress,
    );

    const lpTokenscarl = await pair.balanceOf(carlAddress);
    console.log(`\t LP Tokens Carl balance: ${lpTokenscarl}`);
    await showReserves(pair);
    console.log("\n");

    console.log(`\t Bob Remove Liquidity: ${lpTokensBob}`);
    await pair.connect(bob).approve(router.address, MaxUint256);
    await router.connect(bob).removeLiquidity(
      token0.address,
      token1.address,
      lpTokensBob,
      0,
      0,
      bobAddress,
      MaxUint256,
      overrides
    );

    console.log(`\t Bob token0.balanceOf: ${await token0.balanceOf(bobAddress)}`);
    console.log(`\t Bob token1.balanceOf: ${await token1.balanceOf(bobAddress)}`);
    await showReserves(pair);


  });
});
