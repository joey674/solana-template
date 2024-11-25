const web3 = require("@solana/web3.js");
const fs = require("mz/fs");
const path = require("path");
const BN = require("bn.js");// for big number 

const RPC_URL = "http://127.0.0.1:8899";
const PROGRAM_KEYPAIR_PATH = path.join(
  path.resolve(__dirname, "../dist/program/program-keypair.json")
);
const COUNTER_ACCOUNT_PUBKEY = process.argv[2];

async function main() {
  console.log("launching client...");

  /* get program info */
  const programSecretKeyString = await fs.readFile(PROGRAM_KEYPAIR_PATH, {
    encoding: "utf8",
  });
  const programSecretKey = Uint8Array.from(JSON.parse(programSecretKeyString));
  const programKeyPair = web3.Keypair.fromSecretKey(programSecretKey);
  const programId = programKeyPair.publicKey;

  /* connect to solana */
  const connection = new web3.Connection(RPC_URL, "confirmed");
  let transaction = new web3.Transaction();

  /* generate a feepayer account and airdrop some SOL*/
  const feepayerAccount = new web3.Keypair();
  await connection.requestAirdrop(
    feepayerAccount.publicKey,
    5 * web3.LAMPORTS_PER_SOL
  );

  /* 账户授权:交易提供需要签名的账户（signers），从而证明这些账户的授权，并确保交易可以成功提交到 Solana 网络 */
  let signers = [feepayerAccount]; // 授权成为付费账户

  /* generate or use counter account using feepayer account */
  let counterAccountPubkey;
  if (!COUNTER_ACCOUNT_PUBKEY) {
    // 创建新的counter account并分配到合约名下:这也是一条transactionInstruction;
    const counterAccount = new web3.Keypair();
    let deployCounterAccountIx = web3.SystemProgram.createAccount({
      fromPubkey: feepayerAccount.publicKey,
      newAccountPubkey: counterAccount.publicKey,
      lamports: web3.LAMPORTS_PER_SOL,
      space: 8,
      programId: programId,
    });
    transaction.add(deployCounterAccountIx); // 把instruction加入到此次transaction中
    signers.push(counterAccount); // 授权成为计数账户
    counterAccountPubkey = counterAccount.publicKey;
  } else {
    counterAccountPubkey = new web3.PublicKey(COUNTER_ACCOUNT_PUBKEY);
  }

  /* increase counter in counter account */
  let ix = Buffer.from(new Uint8Array([0])); // 对应程序中的定义,0是第一条指令increment,1是第二条指令decrement
  const incrementIx = new web3.TransactionInstruction({
    keys: [
      {
        pubkey: counterAccountPubkey,
        isSigner: false,
        isWritable: true,
      },
    ],
    programId: programId,
    data: ix,
  });
  transaction.add(incrementIx);

  /* 整合所有ix到tx中 */
  let transacionId = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    signers,
    {
      skipPreflight: true,
      preflightCommitment: "confirmed",
      commitment: "confirmed",
    }
  );

  /* 结束后查一下计数器 */
  let data = (
    await connection.getAccountInfo(counterAccountPubkey, "confirmed")
  ).data;
  let count = new BN(data, "le");
  console.log("Counter Key:", counterAccountPubkey.toBase58());
  console.log("Count: ", count.toNumber());
}

main()
  .then(() => {
    console.log("Success");
  })
  .catch((e) => {
    console.error(e);
  });
