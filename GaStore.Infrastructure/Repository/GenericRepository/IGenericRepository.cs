using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data;

namespace GaStore.Infrastructure.Repository.GenericRepository
{
	public interface IGenericRepository<T> where T : EntityBase
	{
		Task<T?> GetById(Guid id);

		Task<T?> GetByIdIncluding(Guid id, params Expression<Func<T, object>>[] includeProperties);

        Task<T?> GetByIdIncluding(Guid id, string includeProperties = "");


        //Task<T> Get(Expression<Func<T, bool>> expression);
        Task<T?> Get(
    Expression<Func<T, bool>> filter,
    Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
    string? includeProperties = null,
    bool trackChanges = false);

		Task<IQueryable<T>> GetAll();
		Task<IEnumerable<T>> GetAllAsync(
	Expression<Func<T, bool>> filter = null,
	Func<IQueryable<T>, IOrderedQueryable<T>> orderBy = null,
	string includeProperties = "",
	bool trackChanges = true);
		Task<IQueryable<T>> GetAllAsc();
		Task<IQueryable<T>> GetAllDesc();
		IQueryable<T> GetAllIncluding(params Expression<Func<T, object>>[] includeProperties);
		Task<IQueryable<T>> GetRecordByNumberAsc();
		Task<IQueryable<T>> GetRecordByNumberDesc();
		Task<IQueryable<T>> GetTenRecords();

		Task<IQueryable<T>> GetOffsetAndLimitAsync();
		Task<IQueryable<T>> GetLimitAsync();


		Task<List<T>> GetLimitAsync(Expression<Func<T, bool>> where, int limit);
		Task<List<T>> GetOffsetAndLimitAsync(Expression<Func<T, bool>> where, int pageNumber, int pageSize);
		Task<List<T>> GetAll(Expression<Func<T, bool>> where);
		Task<List<T>> GetAllAsc(Expression<Func<T, bool>> where);
		Task<List<T>> GetAllDesc(Expression<Func<T, bool>> where);
		Task<List<T>> GetRecordByNumberAsc(Expression<Func<T, bool>> where, int Num);
		Task<List<T>> GetRecordByNumberDesc(Expression<Func<T, bool>> where, int Num);

		Task<List<T>> GetTenRecords(Expression<Func<T, bool>> where);

		IEnumerable<T> Find(Expression<Func<T, bool>> expression);

		Task<bool> Add(T entity);

		Task AddRange(List<T> entities);

		Task<bool> Remove(Guid id);

		Task<bool> Upsert(T entity);
	}
}
