import * as web3 from "@solana/web3.js";
import {
  PublicKey
} from '@solana/web3.js'
import * as anchor from "@coral-xyz/anchor";
import {AnchorProvider, Program, BN, Wallet} from "@coral-xyz/anchor";
import idl from './idl.json'
const { Connection, Keypair, clusterApiUrl, ComputeBudgetProgram, TransactionExpiredBlockheightExceededError, TransactionExpiredTimeoutError } = require('@solana/web3.js');
const fs = require('fs');


async function CheckTransactionStatusConfirmed(transactionId: string): Promise<boolean> {
  let retryAttempts = 5;
  const connection = new Connection("https://lively-wiser-uranium.solana-mainnet.quiknode.pro/893fb87d9e48511199f628cf4c25acc1a6f06c5a/", 'confirmed');
  while(retryAttempts > 0) {
      try {    
          retryAttempts--;
          const transaction = await connection.getParsedTransaction(transactionId, {
            maxSupportedTransactionVersion: 0,
          });
          
          if (transaction) {
            console.log('Transaction has been confirmed and details:', transaction);
            return true;
          } else {
            console.log('Transaction is still unconfirmed or does not exist and wait 15s to retry:');
            await sleep(15000);
          }
      } catch (error) {
          console.error('Error fetching transaction and wait 15s to retry:', error);
          await sleep(15000);
      }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // dev
  const connection = new Connection("https://api-devnet.solana.com", 'confirmed');
  const keypair = Keypair.fromSecretKey(new Uint8Array([]));
  const PRIORITY_FEE_INSTRUCTIONS = ComputeBudgetProgram.setComputeUnitPrice({microLamports: 3000});
  
  const wallet = new Wallet(keypair);

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    maxRetries: 5,
    skipPreflight: true, 
  });

  const idlPath = './idl.json';
  const idlJson = fs.readFileSync(idlPath, 'utf-8');
  const idl = JSON.parse(idlJson);


  const programID = new PublicKey("GBmUeF3tu8PfHjpddLH3q4LERPz1Ftq7aXZwVWebfJwr");
  const program = new Program(idl, programID, provider);

  const { SystemProgram } = anchor.web3;
  // Client
  console.log("My address:", program.provider.publicKey.toString());
  const balance = await program.provider.connection.getBalance(program.provider.publicKey);
  console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);


        

  const user_points = anchor.web3.Keypair.generate();
  const publicKeyOrAddress = user_points.publicKey.toBase58();
  console.log("The user points publickey:", publicKeyOrAddress);
  const user_points_publicKey = new anchor.web3.PublicKey(publicKeyOrAddress);
  console.log(user_points_publicKey.toBase58());


  const txHash = await program.methods
    .initialize(program.provider.publicKey)
    .accounts({
      userPoints: user_points.publicKey,
      authority: program.provider.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions([PRIORITY_FEE_INSTRUCTIONS])
    .signers([user_points])
    .rpc({
      commitment: 'confirmed',
      maxRetries: 5,
      skipPreflight: true, 
    });
  console.log(txHash);
  console.log(user_points.publicKey);

  console.log("fetch with key");
  const dataOnChain1 = await program.account.userPoints.fetch(
    user_points.publicKey
  );
  console.log(dataOnChain1);


  console.log("fetch with recover key");
  const dataOnChain2 = await program.account.userPoints.fetch(
    user_points_publicKey
  );
  console.log(dataOnChain2);


  const user_points_publicKey_initialized =  user_points.publicKey;
  try{
    const string =
      "MEUCIEwWe5ehYeJj/fx75j6+aMMbKQGg4RR7bDP1yKlsPOQUAiEA33EWWSfIvWxqoHY9s1XOYYhFUq5jAv3Okcd2YuCICQk=";
    const uint8Array = new Uint8Array(string.length);
    for (let i = 0; i < string.length; i++) {
      uint8Array[i] = string.charCodeAt(i);
    }
  
    const numberArray = [];
    for (let i = 0; i < uint8Array.length; i++) {
      numberArray.push(uint8Array[i]);
    }
    const signatureArray = numberArray;
    const amount1 = new anchor.BN(10);
   
    const txHash2 = await program.methods
      .claimPoints(amount1, signatureArray)
      .accounts({
        userPoints: user_points_publicKey_initialized,
        authority: program.provider.publicKey,
      })
      .preInstructions([PRIORITY_FEE_INSTRUCTIONS])
      .signers([])
      .rpc({
        commitment: 'confirmed',
        maxRetries: 5,
        skipPreflight: true, 
      });
  
    console.log(txHash2);
  }catch(error) {
    if (error instanceof TransactionExpiredBlockheightExceededError) {
      console.error('TransactionExpiredBlockheightExceededError occurred:', error.message);
      const flag = await CheckTransactionStatusConfirmed(error.signature);
      if(flag) {
          console.log(`claimPoints Success! `);
      }else {
          throw error
      }
    } else if (error instanceof TransactionExpiredTimeoutError) {
        console.error('TransactionExpiredTimeoutError occurred:', error.message);
        const flag = await CheckTransactionStatusConfirmed(error.signature);
        if(flag) {
            console.log(`claimPoints Success! `);
        }else {
            throw error
        }
    }
    else {
        console.error('An error occurred, transaction send failed:', error);
        throw error;
    }
  }

  const dataOnChain = await program.account.userPoints.fetch(
    user_points_publicKey_initialized
  );
  
  console.log(dataOnChain);
}

main();