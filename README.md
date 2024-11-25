
### 本地交互命令
把本地账户信息设置在solana上
```bash
solana config set --keypair /Users/guanzhouyi/.config/solana/id.json
```
设置链接的solana网络 包括devnet(常规开发),testnet(性能测试),mainnet(主网),localhost(本地测试网)
```bash
solana config set --url https://api.devnet.solana.com 
solana config set --url https://api.testnet.solana.com 
solana config set --url https://api.mainnet-beta.solana.com 
solana config set --url http://127.0.0.1:8899  
```
获取本地配置,这里能看链接的网络以及本地设置的账户信息
```bash
solana config get 
```
获取本地部署过的程序
```bash
solana program show --programs
```
获取余额/请求空投
```bash
solana balance
solana airdrop 1
```

### 测试流程
```bash
npm install 
npm run build:program
npm run deploy:program <net>
npm run start:client
```
