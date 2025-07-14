import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  User, 
  Calendar, 
  MapPin, 
  Hash,
  Building,
  FileText,
  Globe,
  Package,
  Clock,
  X,
  BookText
} from "lucide-react";

interface BookViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: any;
}

export default function BookViewModal({ isOpen, onClose, book }: BookViewModalProps) {
  if (!book) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Book Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Book Header */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-24 h-32 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
              {book.coverImage ? (
                <img 
                  src={book.coverImage} 
                  alt={book.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookText className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{book.title}</h3>
              <p className="text-gray-600 mb-2">by {book.author}</p>
              <div className="flex gap-2 mb-2">
                <Badge className={getStatusColor(book.status)}>
                  {book.status?.replace('-', ' ') || 'unknown'}
                </Badge>
                <Badge variant="outline">{book.genre}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {book.availableCopies} of {book.totalCopies} available
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {book.publishedYear}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Book Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Book Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ISBN</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {book.isbn}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Publisher</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {book.publisher}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Language</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {book.language || 'English'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Pages</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {book.pages || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {book.location || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Added Date</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(book.addedDate)}
                  </p>
                </div>
              </div>

              {book.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{book.description}</p>
                </div>
              )}

              {book.categories && book.categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Categories</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {book.categories.map((category: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{book.totalCopies || 0}</div>
                  <div className="text-xs text-blue-600">Total Copies</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{book.availableCopies || 0}</div>
                  <div className="text-xs text-green-600">Available</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {(book.totalCopies || 0) - (book.availableCopies || 0)}
                  </div>
                  <div className="text-xs text-yellow-600">On Loan</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{book.pendingReservations || 0}</div>
                  <div className="text-xs text-purple-600">Reservations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Edit Book
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 