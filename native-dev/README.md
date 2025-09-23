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

### Run Tests

```
> pnpm ts-mocha tests/movie_review.ts

  movie review program
    ✔ add movie review (897ms)
    ✔ update movie review (255ms)
    ✔ update - rating value gt 5 (234ms)
    ✔ update - rating value lt 1 (378ms)
    ✔ update - description longer than 1000 (274ms)
    ✔ update - update uninitialized account
    ✔ wrong payload layout cause invalid instruction data (204ms)
```

## References

[1] https://solana.com/developers/courses/native-onchain-development/deserialize-instruction-data

[2] https://github.com/solana-developers/movie-review-program-client/blob/main/src/index.ts

[3] https://solana.com/developers/courses/native-onchain-development/program-security