#!/bin/bash

SOLANA_PROGRAMS=("program") 

case $1 in
  "clean")
    echo "[Cleaning build artifacts...]"
    cargo clean --manifest-path=./program/Cargo.toml
    rm -rf ./dist
    rm -rf ./program/Cargo.lock
    echo "[Clean completed.]"
    ;;
  
  "build")
    echo "[Building Solana program...]"
    cargo +stable build-bpf --manifest-path=./program/Cargo.toml --bpf-out-dir=./dist/program
    echo "[Build completed.]"
    ;;
  
  "deploy")
    NETWORK=$2

    if [[ -z "$NETWORK" ]]; then
      echo "[Error: No network specified. Use 'devnet', 'testnet', 'mainnet-beta', or 'localhost'.]"
      exit 1
    fi

    # 设置网络
    case $NETWORK in
      "devnet")
        SOLANA_URL="https://api.devnet.solana.com"
        ;;
      "testnet")
        SOLANA_URL="https://api.testnet.solana.com"
        ;;
      "mainnet-beta")
        SOLANA_URL="https://api.mainnet-beta.solana.com"
        ;;
      "localhost")
        echo "[Checking for solana-test-validator...]"
        
        # 检查 solana-test-validator 是否已运行
        VALIDATOR_RUNNING=$(pgrep -f "solana-test-validator")
        if [[ -z "$VALIDATOR_RUNNING" ]]; then
          echo "[Starting solana-test-validator...]"
          osascript <<EOF
  tell application "Terminal"
      do script "solana-test-validator"
  end tell
EOF
          sleep 5 # 等待 validator 启动
        else
          echo "[solana-test-validator is already running.]"
        fi

        # 设置本地 RPC URL
        SOLANA_URL="http://127.0.0.1:8899"
        ;;
      *)
        echo "[Error: Invalid network '$NETWORK'. Use 'devnet', 'testnet', 'mainnet-beta', or 'localhost'.]"
        exit 1
        ;;
    esac

    # 设置 Solana 网络
    echo "[Setting Solana network to $NETWORK ($SOLANA_URL)...]"
    solana config set --url $SOLANA_URL

    # 部署程序
    echo "[Deploying Solana program to $NETWORK...]"
    solana program deploy ./dist/program/program.so --program-id ./dist/program/program-keypair.json
    echo "[Deployment completed.]"
    ;;

    # 
    
  
  *)
    echo "[Invalid command. Use one of the following:"
    echo "  clean   - Clean build artifacts"
    echo "  build   - Build Solana programs"
    echo "  deploy <network> - Deploy Solana programs to a specific network (devnet, testnet, mainnet-beta, localhost)]"
    ;;
esac