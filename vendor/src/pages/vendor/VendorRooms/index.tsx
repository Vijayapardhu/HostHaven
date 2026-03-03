import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BedDouble, Edit, Plus, Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { roomsService } from "@/lib/rooms";
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";

interface PropertyOption {
	id: string;
	name: string;
}

interface RoomRecord {
	id: string;
	name: string;
	type: string;
	capacity: number;
	totalRooms: number;
	availableRooms?: number;
	pricePerNight?: number;
	basePrice?: number;
	isActive?: boolean;
}

const VendorRoomsIndex = () => {
	const navigate = useNavigate();
	const { toast } = useToast();

	const [properties, setProperties] = useState<PropertyOption[]>([]);
	const [selectedPropertyId, setSelectedPropertyId] = useState("");
	const [rooms, setRooms] = useState<RoomRecord[]>([]);
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const fetchProperties = async () => {
		const response = await vendorService.getProperties();
		const list = (response?.data || response || []).map((property: any) => ({
			id: property.id,
			name: property.name,
		}));
		setProperties(list);

		if (!selectedPropertyId && list.length > 0) {
			setSelectedPropertyId(list[0].id);
			return list[0].id;
		}

		return selectedPropertyId;
	};

	const fetchRooms = async (propertyId?: string) => {
		const response = await roomsService.getRooms(propertyId || undefined);
		const roomList = Array.isArray(response) ? response : response?.rooms || [];
		setRooms(roomList);
	};

	const loadData = async () => {
		setIsLoading(true);
		setErrorMessage(null);
		try {
			const propertyId = await fetchProperties();
			await fetchRooms(propertyId || undefined);
		} catch (error: any) {
			setErrorMessage(error?.message || "Failed to load rooms.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	useEffect(() => {
		if (!selectedPropertyId) {
			return;
		}

		void fetchRooms(selectedPropertyId);
	}, [selectedPropertyId]);

	const filteredRooms = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) {
			return rooms;
		}

		return rooms.filter((room) => {
			return room.name.toLowerCase().includes(query) || room.type.toLowerCase().includes(query);
		});
	}, [rooms, search]);

	const handleDeleteRoom = async (id: string) => {
		if (!window.confirm("Delete this room?")) {
			return;
		}

		try {
			await roomsService.deleteRoom(id);
			toast({ title: "Room deleted" });
			await fetchRooms(selectedPropertyId || undefined);
		} catch (error: any) {
			toast({
				title: "Delete failed",
				description: error?.message || "Unable to delete room",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-serif font-bold text-foreground">Room Management</h1>
					<p className="text-muted-foreground mt-1">Create, update and manage room types</p>
				</div>
				<Button onClick={() => navigate("/vendor/rooms/add")} className="gap-2">
					<Plus className="w-4 h-4" />
					Add Room
				</Button>
			</div>

			<div className="flex flex-col md:flex-row gap-4">
				<select
					title="Select property"
					aria-label="Select property"
					value={selectedPropertyId}
					onChange={(event) => setSelectedPropertyId(event.target.value)}
					className="h-10 rounded-md border border-input bg-background px-3"
				>
					<option value="">All properties</option>
					{properties.map((property) => (
						<option key={property.id} value={property.id}>
							{property.name}
						</option>
					))}
				</select>
				<div className="relative flex-1">
					<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search by room name or type"
						className="pl-9"
					/>
				</div>
			</div>

			{isLoading ? (
				<LoadingState message="Loading rooms..." />
			) : errorMessage ? (
				<ErrorState title="Unable to load rooms" description={errorMessage} onRetry={loadData} />
			) : filteredRooms.length === 0 ? (
				<EmptyState
					icon={<BedDouble className="w-12 h-12 text-muted" />}
					title="No rooms found"
					description="Add your first room type to start accepting bookings."
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredRooms.map((room) => (
						<Card key={room.id} className="border-0 shadow-sm">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between gap-2">
									<div>
										<CardTitle className="text-lg">{room.name}</CardTitle>
										<p className="text-sm text-muted-foreground mt-1 capitalize">{room.type}</p>
									</div>
									<Badge variant={room.isActive === false ? "secondary" : "default"}>
										{room.isActive === false ? "Inactive" : "Active"}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Capacity</span>
									<span className="font-medium">{room.capacity}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Available</span>
									<span className="font-medium">{room.availableRooms ?? room.totalRooms}/{room.totalRooms}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Price</span>
									<span className="font-medium">₹{(room.pricePerNight ?? room.basePrice ?? 0).toLocaleString()}</span>
								</div>

								<div className="pt-2 flex gap-2">
									<Button variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/vendor/rooms/${room.id}/edit`)}>
										<Edit className="w-4 h-4" />
										Edit
									</Button>
									<Button variant="destructive" className="gap-2" onClick={() => handleDeleteRoom(room.id)}>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
};

export default VendorRoomsIndex;
