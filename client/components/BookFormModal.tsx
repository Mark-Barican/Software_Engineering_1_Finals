import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  BookOpen, 
  User, 
  Hash, 
  Building, 
  Calendar, 
  Tag, 
  MapPin, 
  Image, 
  FileText,
  Globe,
  Download,
  Eye,
  X,
  Plus,
  AlertTriangle
} from "lucide-react";

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publishedYear: number;
  genre: string;
  description: string;
  coverImage: string;
  totalCopies: number;
  location: string;
  language: string;
  pages: number;
  hasDownload: boolean;
  hasReadOnline: boolean;
  categories: string[];
}

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: BookFormData) => Promise<void>;
  book?: any; // For editing existing book
  mode: 'add' | 'edit';
}

const GENRES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller',
  'Romance', 'Historical Fiction', 'Biography', 'Autobiography', 'History',
  'Science', 'Technology', 'Philosophy', 'Religion', 'Self-Help', 'Business',
  'Economics', 'Politics', 'Travel', 'Cooking', 'Art', 'Music', 'Poetry',
  'Drama', 'Comics', 'Children', 'Young Adult', 'Reference', 'Textbook'
];

const LOCATIONS = [
  'Shelf A1', 'Shelf A2', 'Shelf A3', 'Shelf B1', 'Shelf B2', 'Shelf B3',
  'Shelf C1', 'Shelf C2', 'Shelf C3', 'Section A', 'Section B', 'Section C',
  'Reference Section', 'Periodicals', 'Special Collections', 'Reserve Desk'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
];

export default function BookFormModal({ isOpen, onClose, onSave, book, mode }: BookFormModalProps) {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishedYear: new Date().getFullYear(),
    genre: '',
    description: '',
    coverImage: '',
    totalCopies: 1,
    location: '',
    language: 'English',
    pages: 0,
    hasDownload: false,
    hasReadOnline: false,
    categories: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (book && mode === 'edit') {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        publishedYear: book.publishedYear || new Date().getFullYear(),
        genre: book.genre || '',
        description: book.description || '',
        coverImage: book.coverImage || '',
        totalCopies: book.totalCopies || 1,
        location: book.location || '',
        language: book.language || 'English',
        pages: book.pages || 0,
        hasDownload: book.hasDownload || false,
        hasReadOnline: book.hasReadOnline || false,
        categories: book.categories || []
      });
    } else {
      // Reset form for new book
      setFormData({
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        publishedYear: new Date().getFullYear(),
        genre: '',
        description: '',
        coverImage: '',
        totalCopies: 1,
        location: '',
        language: 'English',
        pages: 0,
        hasDownload: false,
        hasReadOnline: false,
        categories: []
      });
    }
    setErrors({});
  }, [book, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.isbn.trim()) newErrors.isbn = 'ISBN is required';
    if (!formData.publisher.trim()) newErrors.publisher = 'Publisher is required';
    if (!formData.publishedYear || formData.publishedYear < 1800 || formData.publishedYear > new Date().getFullYear() + 1) {
      newErrors.publishedYear = 'Valid publication year is required';
    }
    if (!formData.genre) newErrors.genre = 'Genre is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (formData.totalCopies < 1) newErrors.totalCopies = 'At least 1 copy is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving book:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  const handleInputChange = (field: keyof BookFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {mode === 'add' ? 'Add New Book' : 'Edit Book'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Add a new book to the library collection' 
              : 'Update book information and details'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>Essential book details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter book title"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author" className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Author(s) *
                  </Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder="Enter author name"
                    className={errors.author ? "border-red-500" : ""}
                  />
                  {errors.author && <p className="text-sm text-red-500">{errors.author}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isbn" className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    ISBN *
                  </Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => handleInputChange('isbn', e.target.value)}
                    placeholder="Enter ISBN or catalog number"
                    className={errors.isbn ? "border-red-500" : ""}
                  />
                  {errors.isbn && <p className="text-sm text-red-500">{errors.isbn}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publisher" className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    Publisher *
                  </Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                    placeholder="Enter publisher name"
                    className={errors.publisher ? "border-red-500" : ""}
                  />
                  {errors.publisher && <p className="text-sm text-red-500">{errors.publisher}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishedYear" className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Publication Year *
                  </Label>
                  <Input
                    id="publishedYear"
                    type="number"
                    value={formData.publishedYear}
                    onChange={(e) => handleInputChange('publishedYear', parseInt(e.target.value))}
                    min="1800"
                    max={new Date().getFullYear() + 1}
                    className={errors.publishedYear ? "border-red-500" : ""}
                  />
                  {errors.publishedYear && <p className="text-sm text-red-500">{errors.publishedYear}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre" className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Genre/Category *
                  </Label>
                  <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                    <SelectTrigger className={errors.genre ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.genre && <p className="text-sm text-red-500">{errors.genre}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter book description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory & Location</CardTitle>
              <CardDescription>Stock and physical location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCopies" className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Total Copies *
                  </Label>
                  <Input
                    id="totalCopies"
                    type="number"
                    min="1"
                    value={formData.totalCopies}
                    onChange={(e) => handleInputChange('totalCopies', parseInt(e.target.value))}
                    className={errors.totalCopies ? "border-red-500" : ""}
                  />
                  {errors.totalCopies && <p className="text-sm text-red-500">{errors.totalCopies}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location *
                  </Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger className={errors.location ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Language
                  </Label>
                  <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(language => (
                        <SelectItem key={language} value={language}>{language}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pages">Number of Pages</Label>
                <Input
                  id="pages"
                  type="number"
                  min="0"
                  value={formData.pages}
                  onChange={(e) => handleInputChange('pages', parseInt(e.target.value) || 0)}
                  placeholder="Enter number of pages"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories & Tags</CardTitle>
              <CardDescription>Additional categories for better organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add a category"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                />
                <Button type="button" onClick={addCategory} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Book Cover */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Book Cover</CardTitle>
              <CardDescription>Upload or provide URL for book cover image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coverImage" className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  Cover Image URL
                </Label>
                <Input
                  id="coverImage"
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => handleInputChange('coverImage', e.target.value)}
                  placeholder="https://example.com/book-cover.jpg"
                />
              </div>
              
              {formData.coverImage && (
                <div className="flex items-center gap-4">
                  <img 
                    src={formData.coverImage} 
                    alt="Book cover preview" 
                    className="w-20 h-28 object-cover border rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="text-sm text-gray-600">
                    Cover image preview
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Features</CardTitle>
              <CardDescription>Digital access options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasDownload"
                  checked={formData.hasDownload}
                  onChange={(e) => handleInputChange('hasDownload', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="hasDownload" className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Available for Download
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasReadOnline"
                  checked={formData.hasReadOnline}
                  onChange={(e) => handleInputChange('hasReadOnline', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="hasReadOnline" className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  Available to Read Online
                </Label>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Book' : 'Update Book'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 