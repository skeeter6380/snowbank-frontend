import { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Grid, InputAdornment, OutlinedInput, Zoom } from "@material-ui/core";
import RebaseTimer from "../../components/RebaseTimer";
import { trim } from "../../helpers";
import { changeStake, changeApproval } from "../../store/slices/stake-thunk";
import "./stake.scss";
import { useWeb3Context } from "../../hooks";
import { IPendingTxn, isPendingTxn, txnButtonText } from "../../store/slices/pending-txns-slice";
import { Skeleton } from "@material-ui/lab";
import { IReduxState } from "../../store/slices/state.interface";
import { messages } from "../../constants/messages";
import classnames from "classnames";
import { warning } from "../../store/slices/messages-slice";
import { IAppSlice } from "../../store/slices/app-slice";

function Stake() {
    const dispatch = useDispatch();
    const { provider, address, connect, chainID, checkWrongNetwork } = useWeb3Context();
    const app = useSelector<IReduxState, IAppSlice>(state => state.app);

    const [view, setView] = useState(0);
    const [quantity, setQuantity] = useState<string>("");

    const isAppLoading = useSelector<IReduxState, boolean>(state => state.app.loading);
    const currentIndex = useSelector<IReduxState, string>(state => {
        return state.app.currentIndex;
    });
    const fiveDayRate = useSelector<IReduxState, number>(state => {
        return state.app.fiveDayRate;
    });
    const sbBalance = useSelector<IReduxState, string>(state => {
        return state.account.balances && state.account.balances.sb;
    });
    const ssbBalance = useSelector<IReduxState, string>(state => {
        return state.account.balances && state.account.balances.ssb;
    });
    const wssbBalance = useSelector<IReduxState, string>(state => {
        return state.account.balances && state.account.balances.wssb;
    });
    const stakeAllowance = useSelector<IReduxState, number>(state => {
        return state.account.staking && state.account.staking.sb;
    });
    const unstakeAllowance = useSelector<IReduxState, number>(state => {
        return state.account.staking && state.account.staking.ssb;
    });
    const stakingRebase = useSelector<IReduxState, number>(state => {
        return state.app.stakingRebase;
    });
    const stakingAPY = useSelector<IReduxState, number>(state => {
        return state.app.stakingAPY;
    });
    const stakingTVL = useSelector<IReduxState, number>(state => {
        return state.app.stakingTVL;
    });

    const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(state => {
        return state.pendingTransactions;
    });

    const setMax = () => {
        if (view === 0) {
            setQuantity(sbBalance);
        } else {
            setQuantity(ssbBalance);
        }
    };

    const onSeekApproval = async (token: string) => {
        if (await checkWrongNetwork()) return;

        await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
    };

    const onChangeStake = async (action: string) => {
        if (await checkWrongNetwork()) return;
        if (quantity === "" || parseFloat(quantity) === 0) {
            dispatch(warning({ text: action === "stake" ? messages.before_stake : messages.before_unstake }));
        } else {
            await dispatch(changeStake({ address, action, value: String(quantity), provider, networkID: chainID }));
            setQuantity("");
        }
    };

    const hasAllowance = useCallback(
        token => {
            if (token === "sb") return stakeAllowance > 0;
            if (token === "ssb") return unstakeAllowance > 0;
            return 0;
        },
        [stakeAllowance],
    );

    const changeView = (newView: number) => () => {
        setView(newView);
        setQuantity("");
    };

    const trimmedMemoBalance = trim(Number(ssbBalance), 6);
    const trimmedWrappedStakedSBBalance = trim(Number(wssbBalance), 6);
    const trimmedStakingAPY = trim(stakingAPY * 100, 1);
    const stakingRebasePercentage = trim(stakingRebase * 100, 4);
    const nextRewardValue = trim((Number(stakingRebasePercentage) / 100) * Number(trimmedMemoBalance), 6);
    const valueOfSB = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(Number(sbBalance) * app.marketPrice);
    const valueOfStakedBalance = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(Number(trimmedMemoBalance) * app.marketPrice);
    const valueOfWrappedStakedBalance = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(Number(trimmedWrappedStakedSBBalance) * app.marketPrice);

    const sumOfAllBalance = Number(sbBalance) + Number(trimmedMemoBalance) + Number(trimmedWrappedStakedSBBalance);
    const valueOfAllBalance = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(sumOfAllBalance * app.marketPrice);

    return (
        <div className="stake-view">
            <Zoom in={true}>
                <div className="stake-card">
                    <Grid className="stake-card-grid" container direction="column" spacing={2}>
                        <Grid item>
                            <div className="stake-card-header">
                                <p className="stake-card-header-title">Stake (3,3)</p>
                                <RebaseTimer />
                            </div>
                        </Grid>

                        <Grid item>
                            <div className="stake-card-metrics">
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3} md={3} lg={3}>
                                        <div className="stake-card-apy">
                                            <p className="stake-card-metrics-title">APY</p>
                                            <p className="stake-card-metrics-value">
                                                {stakingAPY ? <>{new Intl.NumberFormat("en-US").format(Number(trimmedStakingAPY))}%</> : <Skeleton width="150px" />}
                                            </p>
                                        </div>
                                    </Grid>

                                    <Grid item xs={6} sm={3} md={3} lg={3}>
                                        <div className="stake-card-tvl">
                                            <p className="stake-card-metrics-title">TVL</p>
                                            <p className="stake-card-metrics-value">
                                                {stakingTVL ? (
                                                    new Intl.NumberFormat("en-US", {
                                                        style: "currency",
                                                        currency: "USD",
                                                        maximumFractionDigits: 0,
                                                        minimumFractionDigits: 0,
                                                    }).format(stakingTVL)
                                                ) : (
                                                    <Skeleton width="150px" />
                                                )}
                                            </p>
                                        </div>
                                    </Grid>

                                    <Grid item xs={6} sm={3} md={3} lg={3}>
                                        <div className="stake-card-index">
                                            <p className="stake-card-metrics-title">Current Index</p>
                                            <p className="stake-card-metrics-value">{currentIndex ? <>{trim(Number(currentIndex), 2)} SB</> : <Skeleton width="150px" />}</p>
                                        </div>
                                    </Grid>

                                    <Grid item xs={6} sm={3} md={3} lg={3}>
                                        <div className="stake-card-index">
                                            <p className="stake-card-metrics-title">SB Price</p>
                                            <p className="stake-card-metrics-value">{isAppLoading ? <Skeleton width="100px" /> : `$${trim(app.marketPrice, 2)}`}</p>
                                        </div>
                                    </Grid>
                                </Grid>
                            </div>
                        </Grid>

                        <div className="stake-card-area">
                            {!address && (
                                <div className="stake-card-wallet-notification">
                                    <div className="stake-card-wallet-connect-btn" onClick={connect}>
                                        <p>Connect Wallet</p>
                                    </div>
                                    <p className="stake-card-wallet-desc-text">Connect your wallet to stake SB tokens!</p>
                                </div>
                            )}
                            {address && (
                                <div>
                                    <div className="stake-card-action-area">
                                        <div className="stake-card-action-stage-btns-wrap">
                                            <div onClick={changeView(0)} className={classnames("stake-card-action-stage-btn", { active: !view })}>
                                                <p>Stake</p>
                                            </div>
                                            <div onClick={changeView(1)} className={classnames("stake-card-action-stage-btn", { active: view })}>
                                                <p>Unstake</p>
                                            </div>
                                        </div>

                                        <div className="stake-card-action-row">
                                            <OutlinedInput
                                                type="number"
                                                placeholder="Amount"
                                                className="stake-card-action-input"
                                                value={quantity}
                                                onChange={e => setQuantity(e.target.value)}
                                                labelWidth={0}
                                                endAdornment={
                                                    <InputAdornment position="end">
                                                        <div onClick={setMax} className="stake-card-action-input-btn">
                                                            <p>Max</p>
                                                        </div>
                                                    </InputAdornment>
                                                }
                                            />

                                            {view === 0 && (
                                                <div className="stake-card-tab-panel">
                                                    {address && hasAllowance("sb") ? (
                                                        <div
                                                            className="stake-card-tab-panel-btn"
                                                            onClick={() => {
                                                                if (isPendingTxn(pendingTransactions, "staking")) return;
                                                                onChangeStake("stake");
                                                            }}
                                                        >
                                                            <p>{txnButtonText(pendingTransactions, "staking", "Stake SB")}</p>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="stake-card-tab-panel-btn"
                                                            onClick={() => {
                                                                if (isPendingTxn(pendingTransactions, "approve_staking")) return;
                                                                onSeekApproval("sb");
                                                            }}
                                                        >
                                                            <p>{txnButtonText(pendingTransactions, "approve_staking", "Approve")}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {view === 1 && (
                                                <div className="stake-card-tab-panel">
                                                    {address && hasAllowance("ssb") ? (
                                                        <div
                                                            className="stake-card-tab-panel-btn"
                                                            onClick={() => {
                                                                if (isPendingTxn(pendingTransactions, "unstaking")) return;
                                                                onChangeStake("unstake");
                                                            }}
                                                        >
                                                            <p>{txnButtonText(pendingTransactions, "unstaking", "Unstake SB")}</p>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="stake-card-tab-panel-btn"
                                                            onClick={() => {
                                                                if (isPendingTxn(pendingTransactions, "approve_unstaking")) return;
                                                                onSeekApproval("ssb");
                                                            }}
                                                        >
                                                            <p>{txnButtonText(pendingTransactions, "approve_unstaking", "Approve")}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="stake-card-action-help-text">
                                            {address && ((!hasAllowance("sb") && view === 0) || (!hasAllowance("ssb") && view === 1)) && (
                                                <p>
                                                    Note: The "Approve" transaction is only needed when staking/unstaking for the first time; subsequent staking/unstaking only
                                                    requires you to perform the "Stake" or "Unstake" transaction.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="stake-user-data">
                                        <div className="data-row">
                                            <p className="data-row-name">Your Balance</p>
                                            <p className="data-row-value">{isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(sbBalance), 4)} SB</>}</p>
                                        </div>

                                        <div className="data-row">
                                            <p className="data-row-name">Your Staked Balance</p>
                                            <p className="data-row-value">{isAppLoading ? <Skeleton width="80px" /> : <>{trimmedMemoBalance} sSB</>}</p>
                                        </div>

                                        <div className="data-row">
                                            <p className="data-row-name">Your Wrapped Staked Balance</p>
                                            <p className="data-row-value">{isAppLoading ? <Skeleton width="80px" /> : <>{trimmedWrappedStakedSBBalance} wsSB</>}</p>
                                        </div>

                                        <div className="data-row">
                                            <p className="data-row-name">Next Reward Amount</p>
                                            <p className="data-row-value">{isAppLoading ? <Skeleton width="80px" /> : <>{nextRewardValue} SB</>}</p>
                                        </div>

                                        <div className="data-row">
                                            <p className="data-row-name">Next Reward Yield</p>
                                            <p className="data-row-value">{isAppLoading ? <Skeleton width="80px" /> : <>{stakingRebasePercentage}%</>}</p>
                                        </div>

                                        <div className="data-row">
                                            <p className="data-row-name">ROI (5-Day Rate)</p>
                                            <p className="data-row-value">{isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(fiveDayRate) * 100, 4)}%</>}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Grid>
                </div>
            </Zoom>
            <Zoom in={true}>
                <div>
                    {address && (
                        <div className="stake-card">
                            <Grid className="stake-card-grid" container direction="column">
                                <Grid item>
                                    <div className="stake-card-header data-row">
                                        <p className="stake-card-header-title">Your Balance</p>
                                        <p className="stake-card-header-title">{isAppLoading ? <Skeleton width="80px" /> : <>{valueOfAllBalance}</>}</p>
                                    </div>
                                </Grid>

                                <div className="stake-card-area">
                                    <div>
                                        <div className="">
                                            <div className="data-row">
                                                <p className="data-row-name">Value of Your SB</p>
                                                <p className="data-row-value"> {isAppLoading ? <Skeleton width="80px" /> : <>{valueOfSB}</>}</p>
                                            </div>

                                            <div className="data-row">
                                                <p className="data-row-name">Value of Your Staked SB</p>
                                                <p className="data-row-value"> {isAppLoading ? <Skeleton width="80px" /> : <>{valueOfStakedBalance}</>}</p>
                                            </div>

                                            <div className="data-row">
                                                <p className="data-row-name">Value of Your Wrapped Staked SB</p>
                                                <p className="data-row-value"> {isAppLoading ? <Skeleton width="80px" /> : <>{valueOfWrappedStakedBalance}</>}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Grid>
                        </div>
                    )}
                </div>
            </Zoom>
        </div>
    );
}

export default Stake;
