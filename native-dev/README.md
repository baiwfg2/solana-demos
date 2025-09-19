solana native program development without using anchor

---

## Getting Started

program:

```
cargo build-sbf
solana program deploy target/deploy/native_dev.so
```

client:
```
pnpm add esrun
pnpm esrun client/helloworld.ts
```

## References

https://solana.com/developers/courses/native-onchain-development/deserialize-instruction-data
https://github.com/solana-developers/movie-review-program-client/blob/main/src/index.ts