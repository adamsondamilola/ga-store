using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data;
using GaStore.Models.Database;


namespace GaStore.Infrastructure.Repository.GenericRepository
{
	public class GenericRepository<T> : IGenericRepository<T> where T : EntityBase
	{
		protected DatabaseContext _context;
		protected DbSet<T> dbSet;

		public GenericRepository(DatabaseContext context)
		{
			_context = context;
			dbSet = _context.Set<T>();
		}

		public async Task<bool> Add(T entity)
		{
			await dbSet.AddAsync(entity);
			return true;
		}

		public async Task AddRange(List<T> entities)
		{
			await dbSet.AddRangeAsync(entities);
		}

		public IEnumerable<T> Find(Expression<Func<T, bool>> expression)
		{
			return dbSet.Where(expression);
		}

		public async Task<IQueryable<T>> GetAll()
		{
			return dbSet;
		}

		public async Task<List<T>> GetAll(Expression<Func<T, bool>> where)
		{
			return await dbSet.Where(where).ToListAsync();
		}

		public async Task<IEnumerable<T>> GetAllAsync(
	Expression<Func<T, bool>> filter = null,
	Func<IQueryable<T>, IOrderedQueryable<T>> orderBy = null,
	string includeProperties = "",
	bool trackChanges = true)
		{
			IQueryable<T> query = dbSet;

			// Disable tracking if not needed (better performance for read-only operations)
			if (!trackChanges)
			{
				query = query.AsNoTracking();
			}

			// Apply filter if provided
			if (filter != null)
			{
				query = query.Where(filter);
			}

			// Include related properties
			foreach (var includeProperty in includeProperties.Split
				(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
			{
				query = query.Include(includeProperty.Trim());
			}

			// Apply ordering if provided
			if (orderBy != null)
			{
				return await orderBy(query).ToListAsync();
			}

			return await query.ToListAsync();
		}

		public async Task<IQueryable<T>> GetAllAsc()
		{
			return dbSet;
		}
		public async Task<List<T>> GetAllAsc(Expression<Func<T, bool>> where)
		{
			return await dbSet.Where(where).OrderBy(d => d.DateCreated).ToListAsync();
		}

		public async Task<IQueryable<T>> GetAllDesc()
		{
			return dbSet;
		}
		public async Task<List<T>> GetAllDesc(Expression<Func<T, bool>> where)
		{
			return await dbSet.Where(where).OrderByDescending(d => d.DateCreated).ToListAsync();
		}

		public IQueryable<T> GetAllIncluding(params Expression<Func<T, object>>[] includeProperties)
		{
			IQueryable<T> query = dbSet.AsNoTracking();

			foreach (var includeProperty in includeProperties)
			{
				query = query.Include(includeProperty);
			}

			return query;
		}

		public async Task<IQueryable<T>> GetRecordByNumberAsc()
		{
			return dbSet;
		}
		public async Task<List<T>> GetRecordByNumberAsc(Expression<Func<T, bool>> where, int Num)
		{
			return await dbSet.Where(where).Take(Num).ToListAsync();
		}

		public async Task<IQueryable<T>> GetRecordByNumberDesc()
		{
			return dbSet;
		}

		public async Task<List<T>> GetRecordByNumberDesc(Expression<Func<T, bool>> where, int Num)
		{
			return await dbSet.Where(where).OrderByDescending(d => d.DateCreated).Take(Num).ToListAsync();
		}

		public async Task<IQueryable<T>> GetTenRecords()
		{
			return dbSet;
		}
		public async Task<List<T>> GetTenRecords(Expression<Func<T, bool>> where)
		{
			return await dbSet.Where(where).Take(10).ToListAsync();
		}

		public async Task<IQueryable<T>> GetLimitAsync()
		{
			return dbSet;
		}
		public async Task<List<T>> GetLimitAsync(Expression<Func<T, bool>> where, int limit)
		{
			return await dbSet.Where(where).Take(limit).ToListAsync();
		}

		//used for pagination
		public async Task<IQueryable<T>> GetOffsetAndLimitAsync()
		{
			return dbSet;
		}
		public async Task<List<T>> GetOffsetAndLimitAsync(Expression<Func<T, bool>> where, int pageNumber, int pageSize)
		{
			return await dbSet.Where(where).OrderByDescending(u => u.Id)
					.Skip((pageNumber - 1) * pageSize)
					.Take(pageSize).ToListAsync();
		}

        public async Task<T?> Get(
    Expression<Func<T, bool>> filter,
    Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
    string? includeProperties = null,
    bool trackChanges = false)
        {
            IQueryable<T> query = trackChanges ? dbSet : dbSet.AsNoTracking();

            query = query.Where(filter);

            // Include properties
            if (!string.IsNullOrEmpty(includeProperties))
            {
                foreach (var includeProperty in includeProperties.Split
                    (new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    query = query.Include(includeProperty.Trim());
                }
            }

            if (orderBy != null)
                query = orderBy(query);

            return await query.FirstOrDefaultAsync();
        }

        public async Task<T?> GetById(Guid id)
		{
			return await dbSet.FindAsync(id);
		}

        public async Task<T?> GetByIdIncluding(Guid id, params Expression<Func<T, object>>[] includeProperties)
        {
            IQueryable<T> query = dbSet;

            foreach (var includeProperty in includeProperties)
            {
                query = query.Include(includeProperty);
            }

            return await query.FirstOrDefaultAsync(e => e.Id == id);
        }

        // Alternative version with string include properties
        public async Task<T?> GetByIdIncluding(Guid id, string includeProperties = "")
        {
            IQueryable<T> query = dbSet;

            foreach (var includeProperty in includeProperties.Split
                (new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
            {
                query = query.Include(includeProperty.Trim());
            }

            return await query.FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<bool> Remove(Guid id)
		{
			var t = await dbSet.FindAsync(id);

			if (t != null)
			{
				dbSet.Remove(t);
				return true;
			}
			else
				return false;
		}

		public async Task<bool> Upsert(T entity)
		{
			try
			{
				//dbSet.Attach(entity);
				//dbSet.Update(entity);

				if (entity != null)
				{
					_context.Entry(entity).State = EntityState.Detached;
					dbSet.Update(entity);
				}
			}
			catch (Exception ex)
			{
				return false;
			}

			return true;
		}

	}
}
