import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("TokenSale", function () {
  let token;
  let tokenSale;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Token contract
    const TokenFactory = await ethers.getContractFactory("Token");
    token = await TokenFactory.deploy("Group08", "G8", owner.address);
    await token.deployed();

    // Deploy TokenSale contract with the token address
    const initialSupply = ethers.utils.parseUnits("1000", 18); // 1000 tokens
    const TokenSaleFactory = await ethers.getContractFactory("TokenSale");
    tokenSale = await TokenSaleFactory.deploy(token.address, initialSupply);
    await tokenSale.deployed();

    // Mint some tokens to the TokenSale contract
    await token.mint(initialSupply);

    // Approve the TokenSale contract to spend tokens on behalf of the owner
    await token.approve(tokenSale.address, initialSupply);
    
  });

  it("Should set the correct token address and total supply", async function () {
    expect(await tokenSale.token()).to.equal(token.address);
    expect(await tokenSale.totalSupply()).to.be.deep.equal(ethers.utils.parseUnits("1000", 18));
  });

  it("Should allow buying tokens and update tokensSold", async function () {
    const amountToBuy = ethers.utils.parseUnits("10", 18);
    const price = await tokenSale.getTokenPrice(amountToBuy);

    // addr1 sends ETH to buy tokens
    await tokenSale.connect(addr1).buyTokens(amountToBuy, { value: price });

    expect(await token.balanceOf(addr1.address)).to.be.deep.equal(ethers.BigNumber.from(amountToBuy));
    expect(await tokenSale.tokensSold()).to.be.deep.equal(ethers.BigNumber.from(amountToBuy));
  });

  it("Should fail if insufficient ETH sent", async function () {
    const amountToBuy = ethers.utils.parseUnits("10", 18);
    const price = await tokenSale.getTokenPrice(amountToBuy);
    try {
      // addr1 sends less ETH than required
      await tokenSale.connect(addr1).buyTokens(amountToBuy, { value: price.sub(1) });
      // If it gets here, the test should fail
      expect.fail("Expected transaction to revert, but it succeeded");
    } catch (error) {
      // Check revert reason (optional)
      expect(error.message).to.include("Insufficient ETH sent");
    }
  });

  it("Should fail if sale duration is over", async function () {
    // Simulate passing the sale duration
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // Fast forward 31 days
    await ethers.provider.send("evm_mine", []);

    const amountToBuy = ethers.utils.parseUnits("10", 18);
    const price = await tokenSale.getTokenPrice(amountToBuy);

    try {
      // addr1 tries to buy tokens after sale duration
      await tokenSale.connect(addr1).buyTokens(amountToBuy, { value: price });
      // If it gets here, the test should fail
      expect.fail("Expected transaction to revert, but it succeeded");
    } catch (error) {
      // Check revert reason (optional)
      expect(error.message).to.include("Token sale campaign is stopped");
    }
  });

  it("Should prevent buying more than 50% of the total supply", async function () {
    const amountToBuy = ethers.utils.parseUnits("600", 18); // 600tokens, which is more than 50% of 1M
    const price = await tokenSale.getTokenPrice(amountToBuy);
    try {
      // addr1 tries to buy more than 50% of the total supply
      await tokenSale.connect(addr1).buyTokens(amountToBuy, { value: price });
      // If it gets here, the test should fail
      expect.fail("Expected transaction to revert, but it succeeded");
    } catch (error) {
      // Check revert reason (optional)
      expect(error.message).to.include("Buying tokens is stopped");
    }
  });

  it("Should emit TokensPurchased event after purchase", async function () {
    const amountToBuy = ethers.utils.parseUnits("10", 18);;
    const price = await tokenSale.getTokenPrice(amountToBuy);

    const tx = await tokenSale.connect(addr1).buyTokens(amountToBuy, { value: price });
    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === "TokensPurchased");
    expect(event).to.not.be.undefined;
    expect(event.args[0]).to.equal(addr1.address);
    expect(event.args[1]).to.be.deep.equal(amountToBuy);
    expect(event.args[2]).to.be.deep.equal(price);
  });
});
