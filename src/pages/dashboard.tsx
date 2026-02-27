import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Search, List, AlertTriangle } from 'lucide-react';
import { Shop, ScanLog } from '@/types';

export default function Dashboard() {
    const [shop, setShop] = useState<Shop | null>(null);
    const [stats, setStats] = useState({
        listingCount: 0,
        matchCount: 0,
    });
    const [lastScan, setLastScan] = useState<ScanLog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true);

                // Fetch User's Shop
                const { data: shops } = await supabase.from('shops').select('*').limit(1);
                const currentShop = shops?.[0] || null;
                setShop(currentShop);

                if (currentShop) {
                    // Fetch Stats
                    const { count: listingCount } = await supabase
                        .from('listings')
                        .select('*', { count: 'exact', head: true })
                        .eq('shop_id', currentShop.id);

                    const { count: matchCount } = await supabase
                        .from('matches')
                        .select('*', { count: 'exact', head: true })
                        .eq('shop_id', currentShop.id)
                        .eq('status', 'new');

                    setStats({
                        listingCount: listingCount || 0,
                        matchCount: matchCount || 0,
                    });

                    // Fetch Last Scan
                    const { data: logs } = await supabase
                        .from('scan_logs')
                        .select('*')
                        .eq('shop_id', currentShop.id)
                        .order('started_at', { ascending: false })
                        .limit(1);

                    setLastScan(logs?.[0] || null);
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const handleScanNow = async () => {
        // This will trigger the scan-shop edge function
        alert('Scan triggered! (Backend function call)');
    };

    if (loading) {
        return <div className="p-8 flex items-center justify-center">Loading your dashboard...</div>;
    }

    if (!shop) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Welcome to EtsyGuard</h1>
                <p className="text-gray-500 mb-6">Connect your Etsy shop to start monitoring for copies.</p>
                <Button className="bg-orange-500 hover:bg-orange-600">Connect Etsy Shop</Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Monitoring {shop.shop_name}</p>
                </div>
                <Button onClick={handleScanNow} className="bg-orange-500 hover:bg-orange-600">
                    <Search className="w-4 h-4 mr-2" />
                    Scan Now
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Listings Monitored</CardTitle>
                        <List className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.listingCount}</div>
                        <p className="text-xs text-gray-500">Active products in your shop</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.matchCount}</div>
                        <p className="text-xs text-gray-500">Potential copies found</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Last Scan Status</CardTitle>
                        <Shield className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold capitalize">
                            {lastScan?.status || 'No scans yet'}
                        </div>
                        <p className="text-xs text-gray-500">
                            {lastScan?.completed_at
                                ? new Date(lastScan.completed_at).toLocaleString()
                                : 'Never'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for Match List */}
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No new matches detected in your last scan.</p>
                </div>
            </div>
        </div>
    );
}
