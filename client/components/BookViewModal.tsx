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
  BookText,
  Star,
  Download,
  Eye,
  ExternalLink,
  Edit,
  Bookmark,
  Quote
} from "lucide-react";

interface BookViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: any;
  onEdit?: (book: any) => void;
  onBorrow?: (bookId: string) => void;
  onReserve?: (bookId: string) => void;
  onSave?: (book: any) => void;
  onCite?: (book: any) => void;
  imageKey?: number;
  canBorrow?: boolean;
  canReserve?: boolean;
  showEditButton?: boolean;
}

export default function BookViewModal({ 
  isOpen, 
  onClose, 
  book, 
  onEdit, 
  onBorrow,
  onReserve,
  onSave,
  onCite,
  imageKey = Date.now(),
  canBorrow = true,
  canReserve = true,
  showEditButton = false
}: BookViewModalProps) {
  if (!book) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checked-out':
      case 'low-stock': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-stock':
      case 'reserved': 
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAvailabilityStatus = () => {
    if (book.availableCopies > 0) return 'Available';
    return 'Not Available';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getAvailabilityPercentage = () => {
    if (!book.totalCopies) return 0;
    return Math.round((book.availableCopies / book.totalCopies) * 100);
  };

  // Button styling to match the rest of the interface
  const buttonClass = "h-10 px-6 font-medium transition-all duration-200 hover:scale-105 active:scale-95";
  const primaryButtonClass = `${buttonClass} bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg`;
  const secondaryButtonClass = `${buttonClass} bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md`;
  const outlineButtonClass = `${buttonClass} bg-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-400`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            Book Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Enhanced Book Header with Large Cover Image */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex gap-8">
              {/* Large Book Cover */}
              <div className="flex-shrink-0">
                <div className="w-56 h-80 bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-white">
                  {book.coverImage ? (
                    <img 
                      src={`${book.coverImage}?t=${imageKey}`} 
                      alt={`Cover of ${book.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                              <div class="text-center p-6">
                                <svg class="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                </svg>
                                <p class="text-sm font-medium">No Cover Available</p>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                      <div className="text-center p-6">
                        <BookText className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-sm font-medium">No Cover Available</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Cover Image Actions */}
                {book.coverImage && (
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-8 px-3 bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Full
                    </Button>
                    {book.hasDownload && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8 px-3 bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Book Information */}
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">{book.title}</h2>
                  <p className="text-xl text-gray-600 mb-4 font-medium">by {book.author}</p>
                  
                  {/* Status and Genre Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge className={`${getStatusColor(getAvailabilityStatus())} border text-sm px-3 py-1 font-medium`}>
                      {getAvailabilityStatus()}
                    </Badge>
                    <Badge variant="outline" className="bg-white/80 text-sm px-3 py-1 font-medium border-gray-200">
                      {book.genre}
                    </Badge>
                    {book.hasDownload && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1 font-medium">
                        <Download className="w-3 h-3 mr-1" />
                        Downloadable
                      </Badge>
                    )}
                    {book.hasReadOnline && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1 font-medium">
                        <Eye className="w-3 h-3 mr-1" />
                        Read Online
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{book.totalCopies || 0}</div>
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Copies</div>
                  </div>
                  <div className="text-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                    <div className="text-3xl font-bold text-green-600 mb-1">{book.availableCopies || 0}</div>
                    <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Available</div>
                  </div>
                  <div className="text-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">
                      {(book.totalCopies || 0) - (book.availableCopies || 0)}
                    </div>
                    <div className="text-xs text-yellow-600 font-medium uppercase tracking-wide">On Loan</div>
                  </div>
                  <div className="text-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{book.pendingReservations || 0}</div>
                    <div className="text-xs text-purple-600 font-medium uppercase tracking-wide">Reservations</div>
                  </div>
                </div>

                {/* Availability Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Availability Status</span>
                    <span className="text-gray-600 font-medium">{getAvailabilityPercentage()}% Available</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-3 border border-white/50">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${getAvailabilityPercentage()}%` }}
                    ></div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {onBorrow && canBorrow && book.availableCopies > 0 && (
                    <Button
                      onClick={() => {
                        onBorrow(book._id || book.id || '');
                        onClose();
                      }}
                      className={primaryButtonClass}
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Borrow Book
                    </Button>
                  )}
                  
                  {onReserve && canReserve && book.availableCopies === 0 && (
                    <Button
                      onClick={() => {
                        onReserve(book._id || book.id || '');
                        onClose();
                      }}
                      className={secondaryButtonClass}
                    >
                      <Bookmark className="w-5 h-5 mr-2" />
                      Reserve Book
                    </Button>
                  )}
                  
                  {onSave && (
                    <Button
                      onClick={() => onSave(book)}
                      className={outlineButtonClass}
                    >
                      <Bookmark className="w-5 h-5 mr-2" />
                      Save to Library
                    </Button>
                  )}
                  
                  {onCite && (
                    <Button
                      onClick={() => onCite(book)}
                      className={outlineButtonClass}
                    >
                      <Quote className="w-5 h-5 mr-2" />
                      Cite Book
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Book Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <div className="p-1 bg-blue-100 rounded">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  Book Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      ISBN
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{book.isbn || 'Not available'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Publisher
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{book.publisher || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Published Year
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{book.publishedYear || 'Unknown'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Language
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{book.language || 'English'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Pages
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{book.pages || 'Unknown'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{book.location || 'Not specified'}</p>
                  </div>
                </div>

                {book.description && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-900 leading-relaxed">{book.description}</p>
                  </div>
                )}

                {book.categories && book.categories.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-500">Categories</label>
                    <div className="flex flex-wrap gap-1">
                      {book.categories.map((category: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-700 border-gray-200">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <div className="p-1 bg-blue-100 rounded">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Added to Library
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{formatDate(book.addedDate)}</p>
                </div>

                {/* Digital Features */}
                {(book.hasDownload || book.hasReadOnline) && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-500">Digital Features</label>
                    <div className="space-y-2">
                      {book.hasDownload && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="p-1 bg-green-100 rounded">
                            <Download className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-green-800">Available for Download</span>
                            <p className="text-xs text-green-600">Download this book to read offline</p>
                          </div>
                        </div>
                      )}
                      {book.hasReadOnline && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="p-1 bg-blue-100 rounded">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-blue-800">Available to Read Online</span>
                            <p className="text-xs text-blue-600">Read this book directly in your browser</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Genre and Rating Section */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <label className="text-sm font-medium text-gray-500">Genre & Rating</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                        {book.genre}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600 font-medium">4.5 (128 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Footer */}
          {(showEditButton && onEdit) && (
            <div className="flex justify-end items-center pt-6 border-t border-gray-200">
              <Button
                onClick={() => {
                  onEdit(book);
                  onClose();
                }}
                className={secondaryButtonClass}
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit Book
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 