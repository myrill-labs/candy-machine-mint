import {ReactElement, useEffect, useState} from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import {Button, CircularProgress, Grid, Snackbar} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import * as anchor from "@project-serum/anchor";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletDialogButton} from "@solana/wallet-adapter-material-ui";

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintOneToken,
    shortenAddress,
} from "./candy-machine";

const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)`

`; // add your styles here

export interface HomeProps {
    candyMachineId: anchor.web3.PublicKey;
    config: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    startDate: number;
    treasury: anchor.web3.PublicKey;
    txTimeout: number;
}

const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [isActive, setIsActive] = useState(false); // true when countdown completes
    const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

    const [itemsAvailable, setItemsAvailable] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const [startDate, setStartDate] = useState(new Date(props.startDate));

    const wallet = useAnchorWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();

    const refreshCandyMachineState = () => {
        (async () => {
            if (!wallet) return;

            const {
                candyMachine,
                goLiveDate,
                itemsAvailable,
                itemsRemaining,
                itemsRedeemed,
            } = await getCandyMachineState(
                wallet as anchor.Wallet,
                props.candyMachineId,
                props.connection
            );

            setItemsAvailable(itemsAvailable);
            setItemsRemaining(itemsRemaining);
            setItemsRedeemed(itemsRedeemed);

            setIsSoldOut(itemsRemaining === 0);
            setStartDate(goLiveDate);
            setCandyMachine(candyMachine);
        })();
    };

    const onMint = async () => {
        try {
            setIsMinting(true);
            if (wallet && candyMachine?.program) {
                const mintTxId = await mintOneToken(
                    candyMachine,
                    props.config,
                    wallet.publicKey,
                    props.treasury
                );

                const status = await awaitTransactionSignatureConfirmation(
                    mintTxId,
                    props.txTimeout,
                    props.connection,
                    "singleGossip",
                    false
                );

                if (!status?.err) {
                    setAlertState({
                        open: true,
                        message: "Congratulations! Mint succeeded!",
                        severity: "success",
                    });
                } else {
                    setAlertState({
                        open: true,
                        message: "Mint failed! Please try again!",
                        severity: "error",
                    });
                }
            }
        } catch (error: any) {
            // TODO: blech:
            let message = error.msg || "Minting failed! Please try again!";
            if (!error.msg) {
                if (error.message.indexOf("0x138")) {
                } else if (error.message.indexOf("0x137")) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf("0x135")) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            } else {
                if (error.code === 311) {
                    message = `SOLD OUT!`;
                    setIsSoldOut(true);
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
            setIsMinting(false);
            refreshCandyMachineState();
        }
    };

    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [wallet, props.connection]);

    useEffect(refreshCandyMachineState, [
        wallet,
        props.candyMachineId,
        props.connection,
    ]);

    const ColorButton = styled(Button)(({theme}) => ({

        backgroundColor: "rgba(25, 200, 255, 0.1)",
        color: "white",
        '&:hover': {
            color: "rgba(100, 100, 255, 0.8)",
            backgroundColor: "pink"
        },
    }));

    const MenuButton = styled(Button)(({theme}) => ({
        color: "white",
        backgroundColor: "none",
        '&:hover': {
            backgroundColor: "pink",
            color: "rgba(100, 100, 255, 0.8)"
        },
    }));

    const SolIcon: React.FC = (): ReactElement => {
        return <img
            style={{"width": "25px", "transform": "translateY(5px)"}}
            src={"https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png"}/>
    }

    useEffect(() => {
        document.title = "Join Myrill"
    }, []);

    return (
        <main>
            <div style={{"margin": "15px"}}>
                <Grid container>
                    <Grid item xs={6} md={8}>
                        <img style={{"width": "50px", "transform": "translateY(10px)", "marginRight": "40px"}}
                             src={"https://myrmidons.myrill.io/myrill-logo.svg"}/>

                        <a style={{"textDecoration": "none"}} target="_blank" rel="noopener noreferrer"
                           href={"https://myrmidons.myrill.io/"}>
                            <MenuButton size={"large"}>Marketplace</MenuButton>
                        </a>
                        <a style={{"textDecoration": "none"}} target="_blank" rel="noopener noreferrer"
                           href={"https://myrill.io/whitepaper"}>
                            <MenuButton size={"large"}>Whitepaper</MenuButton>
                        </a>

                        <a style={{"textDecoration": "none"}} target="_blank" rel="noopener noreferrer"
                           href={"https://myrill.io/club"}>
                            <MenuButton size={"large"}>Myrill Club</MenuButton>
                        </a>
                    </Grid>
                    <Grid item xs={6} md={4}>

                        <div className={"walletDiv"}>
                            {wallet && (
                                <p>
                                    Wallet {shortenAddress(wallet.publicKey.toBase58() || "")}
                                    <div style={{"marginRight": "10px"}}></div>
                                    <SolIcon/> {(balance || 0).toLocaleString()}

                                </p>
                            )}
                        </div>
                    </Grid>
                </Grid>
            </div>
            {/*<div*/}
            {/*    style={{*/}
            {/*        fontSize: "25px",*/}
            {/*        margin: "5px",*/}
            {/*        display: 'flex',*/}
            {/*        flexDirection: 'row',*/}
            {/*    }}*/}
            {/*>*/}
            {/*  */}


            {/*</div>*/}

            <div className="space-30"></div>

            {/*<Grid container spacing={2}>*/}
            <div className={"mintDiv"}>
                <div className="space-30"></div>

                <img
                    className={"NFT"}
                    src={"https://arweave.net/9icLE0p82yTCnjWVW9tTSQ3NOc_ajGnuUjA5cvE2Sus?ext=png"}
                    alt="NFT"/>

                <div className="space-10"></div>
                <div>


                    {wallet && <p>Total Available: {itemsAvailable}</p>}

                    {wallet && <p>Redeemed: {itemsRedeemed}</p>}

                    {wallet && <p>Remaining: {itemsRemaining}</p>}

                    <p>price: <SolIcon/> 5 </p>

                    <MintContainer>
                        {!wallet ? (
                            <ConnectButton>Connect Wallet</ConnectButton>
                        ) : (
                            <ColorButton
                                disabled={isSoldOut || isMinting || !isActive}
                                onClick={onMint}
                                variant="contained"
                            >
                                {isSoldOut ? (
                                    "SOLD OUT"
                                ) : isActive ? (
                                    isMinting ? (
                                        <CircularProgress/>
                                    ) : (
                                        "BUY NFT"
                                    )
                                ) : (
                                    <Countdown
                                        date={startDate}
                                        onMount={({completed}) => completed && setIsActive(true)}
                                        onComplete={() => setIsActive(true)}
                                        renderer={renderCounter}
                                    />
                                )}
                            </ColorButton>
                        )}
                    </MintContainer>

                    <Snackbar
                        open={alertState.open}
                        autoHideDuration={6000}
                        onClose={() => setAlertState({...alertState, open: false})}
                    >
                        <Alert
                            onClose={() => setAlertState({...alertState, open: false})}
                            severity={alertState.severity}
                        >
                            {alertState.message}
                        </Alert>
                    </Snackbar>
                    <div className="space-30"></div>
                </div>

            </div>
            <div className="space-30"></div>
            {/*</Grid>*/}


            <div className={"footerDiv"}>
                <a style={{"margin": "10px", "textDecoration": "none"}}
                   href={'https://www.linkedin.com/company/myrill'}><MenuButton size={"large"}>Linkedin</MenuButton></a>

                <a style={{"margin": "10px", "textDecoration": "none"}}
                   href={'https://twitter.com/myrill_io'}><MenuButton size={"large"}>Twitter</MenuButton></a>

                <a style={{"margin": "10px", "textDecoration": "none"}}
                   href={'https://discord.gg/UQudVUA3KE'}><MenuButton size={"large"}>Discord</MenuButton></a>

                <a style={{"margin": "10px", "textDecoration": "none"}}
                   href={'https://www.instagram.com/myrill.io/'}><MenuButton size={"large"}>Instagram</MenuButton></a>

            </div>
            <div className="space-30"></div>
        </main>
    );
};

interface AlertState {
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({days, hours, minutes, seconds, completed}: any) => {
    return (
        <CounterText>
            {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
        </CounterText>
    );
};

export default Home;
