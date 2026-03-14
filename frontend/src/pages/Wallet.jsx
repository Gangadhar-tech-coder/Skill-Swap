/**
 * Wallet page – credit balance, earned/spent summary, and transaction history.
 */
import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, Coins, Gift } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function WalletPage() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walRes, txRes] = await Promise.all([
          api.get('/api/wallet/'),
          api.get('/api/wallet/transactions'),
        ]);
        setWallet(walRes.data);
        setTransactions(txRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Wallet size={28} color="var(--primary)" />
            Skill <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wallet</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your skill credits, earnings, and spending</p>
        </div>

        {/* Balance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Main Balance */}
          <div className="glass-card animate-fade-in-up animate-pulse-glow" style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.2) 0%, rgba(255,107,157,0.1) 100%)',
            textAlign: 'center', padding: '2rem',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--gradient-primary)', margin: '0 auto 1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Coins size={26} color="white" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Current Balance</p>
            <p style={{
              fontSize: '2.5rem', fontWeight: 800,
              background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {user?.skill_credits?.toFixed(1)}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Skill Credits</p>
          </div>

          {/* Earned */}
          <div className="glass-card animate-fade-in-up delay-100">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Earned</p>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(0,212,170,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={20} color="var(--accent)" />
              </div>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>
              +{wallet?.total_earned?.toFixed(1) || '0.0'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>Credits from teaching</p>
          </div>

          {/* Spent */}
          <div className="glass-card animate-fade-in-up delay-200">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Spent</p>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(255,107,157,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingDown size={20} color="var(--secondary)" />
              </div>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
              -{wallet?.total_spent?.toFixed(1) || '0.0'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>Credits from learning</p>
          </div>
        </div>

        {/* Weekly Credit Allocation */}
        <div className="glass-card animate-fade-in-up delay-200" style={{
          background: 'linear-gradient(135deg, rgba(0,212,170,0.1) 0%, rgba(108,99,255,0.1) 100%)',
          border: '1px solid rgba(0,212,170,0.2)',
          marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={22} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)' }}>Weekly Credit Allocation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                You receive <strong>5 free skill credits</strong> every week!
                {wallet?.next_weekly_credits_in_days != null && (
                  <> Next allocation in <strong style={{ color: 'var(--accent)' }}>{wallet.next_weekly_credits_in_days} day{wallet.next_weekly_credits_in_days !== 1 ? 's' : ''}</strong>.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-card animate-fade-in-up delay-300">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Transaction History
            </h2>
            <span className="badge badge-primary">{transactions.length} transactions</span>
          </div>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Wallet size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No transactions yet. Start teaching or learning!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {transactions.map((tx) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem', borderRadius: '10px',
                  background: 'rgba(15,15,26,0.4)', border: '1px solid rgba(108,99,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: tx.type === 'earned' ? 'rgba(0,212,170,0.15)' : 'rgba(255,107,157,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {tx.type === 'earned'
                        ? <ArrowUpRight size={18} color="var(--accent)" />
                        : <ArrowDownRight size={18} color="var(--secondary)" />}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{tx.description}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '1.05rem', fontWeight: 700,
                    color: tx.type === 'earned' ? 'var(--accent)' : 'var(--secondary)',
                  }}>
                    {tx.type === 'earned' ? '+' : '-'}{tx.credits.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
