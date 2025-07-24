import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, List, ListItem, ListItemText, Paper, Rating, Stack, IconButton, Menu, MenuItem, Divider, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const CommentSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:9999/reviews/${productId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newReview.rating === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }
    if (!newReview.comment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:9999/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setReviews([...reviews, data]);
      setNewReview({ rating: 0, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, review) => {
    setAnchorEl(event.currentTarget);
    setEditingReview(review);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async (reviewId) => {
    try {
      setUpdating(true);
      const response = await fetch(`http://localhost:9999/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setReviews(reviews.filter(review => review._id !== reviewId));
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Có lỗi xảy ra khi xóa đánh giá');
    } finally {
      setUpdating(false);
      setEditingReview(null);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setEditComment(review.comment);
    handleMenuClose();
  };

  const handleSaveEdit = async (reviewId) => {
    if (!editComment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setUpdating(true);
      
      const response = await fetch(`http://localhost:9999/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: editComment
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }

      setReviews(reviews.map(review => 
        review._id === reviewId ? {...review, comment: editComment} : review
      ));
      
      setEditingReview(null);
      setEditComment('');
    } catch (error) {
      console.error('Error updating review:', error);
      alert(`Có lỗi xảy ra khi cập nhật đánh giá: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setEditComment('');
  };

  if (loading && reviews.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Đánh giá sản phẩm
      </Typography>
      
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Box>
              <Typography component="legend">Chọn số sao đánh giá</Typography>
              <Rating
                value={newReview.rating}
                onChange={(event, newValue) => {
                  setNewReview({ ...newReview, rating: newValue });
                }}
                size="large"
              />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Viết đánh giá của bạn..."
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            />
            
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading || !newReview.rating || !newReview.comment.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </Stack>
        </form>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Các đánh giá ({reviews.length})
      </Typography>
      
      <Divider sx={{ mb: 2 }} />

      {reviews.length > 0 ? (
        <List sx={{ bgcolor: 'background.paper' }}>
          {reviews.map((review) => (
            <Paper key={review._id} elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
              <ListItem
                alignItems="flex-start"
                sx={{ display: 'block', p: 2 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Rating value={review.rating} readOnly size="small" />
                  
                  <Box>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(review)}
                      disabled={updating}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(review._id)}
                      disabled={updating}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {editingReview && editingReview._id === review._id ? (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      disabled={updating}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="contained" 
                        size="small"
                        color="primary"
                        onClick={() => handleSaveEdit(review._id)}
                        disabled={updating || !editComment.trim()}
                        startIcon={updating ? <CircularProgress size={16} /> : <SaveIcon />}
                      >
                        {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={cancelEdit}
                        disabled={updating}
                        startIcon={<CancelIcon />}
                      >
                        Hủy
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
                      {review.comment}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Đánh giá ngày {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </>
                )}
              </ListItem>
            </Paper>
          ))}
        </List>
      ) : (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            Chưa có đánh giá nào cho sản phẩm này
          </Typography>
        </Paper>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEdit(editingReview)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={() => handleDelete(editingReview._id)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CommentSection;